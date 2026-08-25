import { Center, Loader } from '@mantine/core';

/** Minimal placeholder while a lazy landing route chunk loads. */
export function LandingRouteFallback() {
  return (
    <Center mih={280} w="100%" aria-busy="true">
      <Loader color="blue" type="dots" />
    </Center>
  );
}
