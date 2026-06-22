import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemaTypes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'ambience-bureau',
  title: 'The Ambience Bureau — CMS',

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('The Ambience Bureau')
          .items([
            S.listItem()
              .title('Object Registry (Products)')
              .child(S.documentTypeList('product').title('Products')),
            S.divider(),
            S.listItem()
              .title('Archive (Blog Posts)')
              .child(S.documentTypeList('post').title('Posts')),
            S.divider(),
            S.listItem()
              .title('Lamp Parts (Configurator)')
              .child(S.documentTypeList('lampPart').title('Lamp Parts')),
            S.listItem()
              .title('Collections')
              .child(S.documentTypeList('collection').title('Collections')),
          ]),
    }),
    visionTool(),
  ],

  schema: { types: schemaTypes },
})
