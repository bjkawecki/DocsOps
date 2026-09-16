/** Counters for merge import (Reuse + Skip). Empty-import leaves zeros unused. */
export type PlatformImportMergeStats = {
  reused: {
    companies: number;
    departments: number;
    teams: number;
    users: number;
    owners: number;
    processes: number;
    projects: number;
    subcontexts: number;
    tags: number;
  };
  created: {
    companies: number;
    departments: number;
    teams: number;
    users: number;
    owners: number;
    processes: number;
    projects: number;
    subcontexts: number;
    tags: number;
    documents: number;
  };
  skipped: {
    teamMembers: number;
    teamLeads: number;
    departmentLeads: number;
    companyLeads: number;
    documentTags: number;
    grants: number;
    pins: number;
  };
};

export function createEmptyMergeStats(): PlatformImportMergeStats {
  return {
    reused: {
      companies: 0,
      departments: 0,
      teams: 0,
      users: 0,
      owners: 0,
      processes: 0,
      projects: 0,
      subcontexts: 0,
      tags: 0,
    },
    created: {
      companies: 0,
      departments: 0,
      teams: 0,
      users: 0,
      owners: 0,
      processes: 0,
      projects: 0,
      subcontexts: 0,
      tags: 0,
      documents: 0,
    },
    skipped: {
      teamMembers: 0,
      teamLeads: 0,
      departmentLeads: 0,
      companyLeads: 0,
      documentTags: 0,
      grants: 0,
      pins: 0,
    },
  };
}
