import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.NavBar()],
  afterBody: [
    // ProfileTabs will be moved to after article content via JavaScript
    Component.ConditionalRender({
      component: Component.ProfileTabs(),
      condition: (page) => page.fileData.frontmatter?.type === "profile",
    }),
    Component.ConditionalRender({
      component: Component.AllImagesGallery(),
      condition: (page) => page.fileData.slug === "pages/all-images",
    }),
  ],
  footer: Component.Footer({
    links: {
      "Home": "/",
      "All Profiles": "/pages/all-profiles",
      "Profiles of Interest": "/pages/profiles-of-interest",
      "About": "/pages/about",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.TagList(),
    // ProfileTabs will be moved to after article content via JavaScript
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.ArticleTitle()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
      ],
    }),
    Component.Explorer(),
  ],
  right: [
    Component.Backlinks(),
  ],
}
