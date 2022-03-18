import myzod, { Infer } from 'myzod';

export const functionsManifestSchemaPage = myzod.object({
  runtime: myzod.string().optional(),
  handler: myzod.string().optional(),
  regions: myzod.array(myzod.string()).optional(),
  maxDuration: myzod.number().optional(),
  memory: myzod.number().min(128).max(3008).optional(),
});

export const functionsManifestSchemaPageWeb = myzod
  .omit(functionsManifestSchemaPage, ['runtime'])
  .and(
    myzod.object({
      runtime: myzod.literal('web'),
      env: myzod.array(myzod.string()),
      files: myzod.array(myzod.string()),
      name: myzod.string(),
      page: myzod.string(),
      regexp: myzod.string(),
      sortingIndex: myzod.number(),
    }),
  );

export const functionsManifestSchema = myzod.object({
  version: myzod.literal(1),
  pages: myzod
    .object({
      '_middleware.js': functionsManifestSchemaPageWeb.optional(),
    })
    .and(
      myzod.record(
        myzod.intersection(
          myzod.partial(
            myzod.omit(functionsManifestSchemaPageWeb, ['runtime']),
          ),
          functionsManifestSchemaPage,
        ),
      ),
    ),
});

export type FunctionsManifest = Infer<typeof functionsManifestSchema>;
