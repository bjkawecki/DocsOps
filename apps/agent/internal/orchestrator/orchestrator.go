package orchestrator

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/bjkawecki/docs-ops/apps/agent/internal/bundle"
	"github.com/bjkawecki/docs-ops/apps/agent/internal/compose"
	"github.com/bjkawecki/docs-ops/apps/agent/internal/config"
	"github.com/bjkawecki/docs-ops/apps/agent/internal/envfile"
	"github.com/bjkawecki/docs-ops/apps/agent/internal/preflight"
	"github.com/bjkawecki/docs-ops/apps/agent/internal/state"
)

type Orchestrator struct {
	Config config.Config
	Store  *state.Store
}

func (o *Orchestrator) ApplyAsync(runID, version string) error {
	if o.Store.IsRunning() {
		return fmt.Errorf("update already running")
	}
	if err := config.ValidateReleaseTag(version); err != nil {
		return err
	}
	if err := o.Store.StartRun(runID, version); err != nil {
		return err
	}
	go func() {
		defer o.releaseLock()
		_ = o.run(context.Background(), runID, version)
	}()
	return nil
}

func (o *Orchestrator) run(ctx context.Context, runID, version string) error {
	log := func(msg string) { o.Store.AppendLog(msg) }

	setPhase := func(p state.Phase) {
		_ = o.Store.SetPhase(p)
		log(fmt.Sprintf("phase=%s", p))
	}

	fail := func(code, msg string) error {
		_ = o.Store.Fail(code, msg)
		return fmt.Errorf("%s: %s", code, msg)
	}

	setPhase(state.PhasePreflight)
	pf := &preflight.Runner{Config: o.Config, LockPath: preflight.LockPath(o.Config.StateDir)}
	result := pf.Run(version)
	if !result.OK {
		for _, c := range result.Checks {
			if !c.OK {
				return fail("PREFLIGHT_FAILED", c.Message)
			}
		}
		return fail("PREFLIGHT_FAILED", "preflight failed")
	}

	if err := o.acquireLock(runID); err != nil {
		return fail("LOCK_FAILED", err.Error())
	}

	bundleSvc := bundle.Service{
		GitHubRepo: o.Config.GitHubRepo,
		StateDir:   o.Config.StateDir,
		InstallDir: o.Config.InstallDir,
		BundlePath: o.Config.BundlePath,
	}

	setPhase(state.PhaseDownloadBundle)
	archivePath, err := bundleSvc.Download(version)
	if err != nil {
		return fail("BUNDLE_DOWNLOAD_FAILED", err.Error())
	}
	log(fmt.Sprintf("bundle=%s", archivePath))

	setPhase(state.PhaseExtractBundle)
	if err := bundleSvc.Extract(archivePath, version); err != nil {
		return fail("BUNDLE_EXTRACT_FAILED", err.Error())
	}

	setPhase(state.PhasePatchEnv)
	current, _ := envfile.ReadVersion(o.Config.EnvFile)
	if current != version {
		if err := envfile.PatchVersion(o.Config.EnvFile, version); err != nil {
			return fail("ENV_PATCH_FAILED", err.Error())
		}
	}

	composeRunner := compose.Runner{
		InstallDir:   o.Config.InstallDir,
		EnvFile:      o.Config.EnvFile,
		ComposeFiles: o.Config.ComposeFiles,
		ExtraCompose: o.Config.ExtraCompose,
		WaitTimeout:  time.Duration(o.Config.ComposeWaitSec) * time.Second,
	}

	if !o.Config.SkipImagePull {
		setPhase(state.PhasePullImages)
		if err := composeRunner.Pull(ctx); err != nil {
			return fail("COMPOSE_PULL_FAILED", err.Error())
		}
	}

	setPhase(state.PhaseComposeUp)
	if err := composeRunner.Up(ctx); err != nil {
		return fail("COMPOSE_UP_FAILED", err.Error())
	}

	setPhase(state.PhaseWaitHealth)
	if err := o.waitHealth(ctx); err != nil {
		return fail("HEALTH_TIMEOUT", err.Error())
	}

	setPhase(state.PhaseVerifyVersion)
	after, err := envfile.ReadVersion(o.Config.EnvFile)
	if err != nil || after != version {
		return fail("VERSION_MISMATCH", fmt.Sprintf("expected %s in env, got %q", version, after))
	}

	setPhase(state.PhaseCleanup)
	_ = o.Store.Succeed()
	return nil
}

func (o *Orchestrator) waitHealth(ctx context.Context) error {
	client := &http.Client{Timeout: 10 * time.Second}
	delay := time.Duration(o.Config.HealthDelaySec) * time.Second
	for i := 0; i < o.Config.HealthRetries; i++ {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, o.Config.HealthURL, nil)
		if err != nil {
			return err
		}
		res, err := client.Do(req)
		if err == nil {
			res.Body.Close()
			if res.StatusCode >= 200 && res.StatusCode < 300 {
				return nil
			}
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(delay):
		}
	}
	return fmt.Errorf("health check failed: %s", o.Config.HealthURL)
}

func (o *Orchestrator) acquireLock(runID string) error {
	if err := os.MkdirAll(filepath.Dir(preflight.LockPath(o.Config.StateDir)), 0o755); err != nil {
		return err
	}
	return os.WriteFile(preflight.LockPath(o.Config.StateDir), []byte(runID+"\n"), 0o644)
}

func (o *Orchestrator) releaseLock() error {
	return os.Remove(preflight.LockPath(o.Config.StateDir))
}

func (o *Orchestrator) Preflight(version string) preflight.Result {
	return (&preflight.Runner{Config: o.Config, LockPath: preflight.LockPath(o.Config.StateDir)}).Run(version)
}

// DemoDeployAsync runs `docsops-demo update` then `docsops-demo reset` on the host (public demo CI hook).
func (o *Orchestrator) DemoDeployAsync(runID, version string) error {
	if !o.Config.DemoHookEnabled {
		return fmt.Errorf("demo hook disabled")
	}
	if o.Store.IsRunning() {
		return fmt.Errorf("update already running")
	}
	if err := config.ValidateReleaseTag(version); err != nil {
		return err
	}
	if err := o.Store.StartRun(runID, version); err != nil {
		return err
	}
	go func() {
		defer o.releaseLock()
		_ = o.runDemoDeploy(runID, version)
	}()
	return nil
}

func (o *Orchestrator) runDemoDeploy(runID, version string) error {
	log := func(msg string) { o.Store.AppendLog(msg) }
	setPhase := func(p state.Phase) {
		_ = o.Store.SetPhase(p)
		log(fmt.Sprintf("phase=%s", p))
	}
	fail := func(code, msg string) error {
		_ = o.Store.Fail(code, msg)
		return fmt.Errorf("%s: %s", code, msg)
	}

	cli := o.Config.DemoCliPath
	if _, err := os.Stat(cli); err != nil {
		return fail("DEMO_CLI_MISSING", fmt.Sprintf("%s: %v", cli, err))
	}

	if err := o.acquireLock(runID); err != nil {
		return fail("LOCK_FAILED", err.Error())
	}

	setPhase(state.PhaseDownloadBundle)
	log(fmt.Sprintf("running: %s update --version %s (skip agent restart)", cli, version))
	updateCmd := exec.Command(cli, "update", "--version", version)
	updateCmd.Env = append(os.Environ(), "DOCSOPS_SKIP_AGENT_RESTART=1")
	updateOut, err := updateCmd.CombinedOutput()
	if len(updateOut) > 0 {
		log(string(updateOut))
	}
	if err != nil {
		return fail("DEMO_UPDATE_FAILED", fmt.Sprintf("%v", err))
	}

	setPhase(state.PhaseComposeUp)
	log(fmt.Sprintf("running: %s reset", cli))
	resetOut, err := exec.Command(cli, "reset").CombinedOutput()
	if len(resetOut) > 0 {
		log(string(resetOut))
	}
	if err != nil {
		return fail("DEMO_RESET_FAILED", fmt.Sprintf("%v", err))
	}

	setPhase(state.PhaseCleanup)
	_ = o.Store.Succeed()
	log("demo deploy succeeded; restarting docsops-agent to load new binary")
	// Best-effort: new binary is already on disk; restart after status is persisted.
	_ = exec.Command("systemctl", "restart", "docsops-agent").Start()
	return nil
}
