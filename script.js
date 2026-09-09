import { PROJECTS, PROJECT_DISPLAY_FILTERS } from "./data/projects.js";
import { SITE } from "./data/site.js";

const state = {
  activeLens: "all",
  hasRenderedProjects: false,
  lastTrigger: null,
  lightboxTrigger: null,
  openProjectSlug: null,
  openProjectMode: null,
  // True only while the currently-open project's history entry was pushed by
  // an in-page navigation this session controlled (an interactive open, or a
  // hashchange/popstate reconciliation) rather than by landing on a project
  // hash directly (initial load or reload). Only in that case is it safe for
  // an explicit Close to consume the entry with `history.back()`; otherwise
  // Close must fall back to the existing silent hash-clearing behavior so it
  // can never navigate the visitor off the portfolio.
  projectHashPushedLocally: false,
  visibleCount: 0
};

const elements = {
  filterBar: document.querySelector("#project-filters"),
  projectStatus: document.querySelector("#project-status"),
  loading: document.querySelector("#project-loading"),
  projectGrid: document.querySelector("#project-grid"),
  loadMoreButton: document.querySelector("#load-more-projects"),
  inlineDetail: document.querySelector("#project-inline"),
  inlineClose: document.querySelector("#project-inline-close"),
  lightbox: document.querySelector("#image-lightbox"),
  lightboxClose: document.querySelector("#image-lightbox-close"),
  lightboxImage: document.querySelector("#image-lightbox-image"),
  lightboxCaption: document.querySelector("#image-lightbox-caption")
};

const inlineElements = {
  featureMedia: document.querySelector("#project-inline-feature-media"),
  gallery: document.querySelector("#project-inline-gallery"),
  kicker: document.querySelector("#project-inline-kicker"),
  title: document.querySelector("#project-inline-title"),
  year: document.querySelector("#project-inline-year"),
  role: document.querySelector("#project-inline-role"),
  type: document.querySelector("#project-inline-type"),
  tags: document.querySelector("#project-inline-tags"),
  description: document.querySelector("#project-inline-description"),
  links: document.querySelector("#project-inline-links")
};

const shellElements = {
  brand: document.querySelector("#site-brand"),
  mark: document.querySelector("#site-mark"),
  contact: document.querySelector("#site-contact"),
  intro: document.querySelector("#site-intro"),
  footerSocialLinks: document.querySelector("#footer-social-links"),
  footerAboutTitle: document.querySelector("#footer-about-title"),
  footerAboutText: document.querySelector("#footer-about-text"),
  footerLocation: document.querySelector("#footer-location"),
  footerRoleLinks: document.querySelector("#footer-role-links")
};

const publishedProjects = PROJECTS.filter((project) => project.draft !== true);
const PROJECT_LENSES = PROJECT_DISPLAY_FILTERS.filter((filter) =>
  ["all", "learning", "research", "moving image"].includes(filter)
);
const PROJECT_HASH_KEY = "project=";
const PROJECT_HASH_PREFIX = `#${PROJECT_HASH_KEY}`;

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const compactGridQuery = window.matchMedia("(max-width: 1100px)");

const FILTER_LABELS = {
  all: "All",
  learning: "Education",
  community: "Participatory",
  research: "Research",
  exhibitions: "Exhibitions",
  web: "Interactive",
  "moving image": "Moving Image"
};

const CATEGORY_LABELS = {
  all: "All",
  learning: "Learning",
  community: "Community",
  research: "Research",
  exhibitions: "Exhibitions",
  web: "Web",
  "moving image": "Moving image"
};

const labelForFilter = (filter) =>
  FILTER_LABELS[filter] || filter;

const labelForCategory = (category) =>
  CATEGORY_LABELS[category] || category;

const matchesLens = (project, lens) =>
  lens === "all" || project.categories.includes(lens);

const getVisibleProjects = () =>
  publishedProjects;

const getInitialProjectCount = () => publishedProjects.length;

const getProjectRevealCount = () => (compactGridQuery.matches ? 3 : 4);

const resetVisibleCount = () => {
  state.visibleCount = getInitialProjectCount();
};

const isExternalUrl = (value) => /^https?:\/\//i.test(value);

const absoluteUrl = (value) => {
  if (!value) {
    return "";
  }

  if (isExternalUrl(value)) {
    return value;
  }

  return new URL(value, SITE.canonicalUrl).href;
};

const setMetaContent = (selector, value) => {
  const element = document.querySelector(selector);
  if (element && value) {
    element.setAttribute("content", value);
  }
};

const renderLinkList = (container, links = []) => {
  const fragment = document.createDocumentFragment();

  links.forEach((link) => {
    const item = document.createElement("li");
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.textContent = link.label;
    if (!link.url.startsWith("mailto:")) {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
    }
    item.append(anchor);
    fragment.append(item);
  });

  container.replaceChildren(fragment);
};

const renderSiteShell = () => {
  document.title = SITE.title;
  setMetaContent("meta[name='description']", SITE.description);
  setMetaContent("meta[property='og:title']", SITE.ogTitle);
  setMetaContent("meta[property='og:description']", SITE.ogDescription);
  setMetaContent("meta[property='og:url']", SITE.canonicalUrl);
  setMetaContent("meta[property='og:image']", absoluteUrl(SITE.socialImage));
  setMetaContent("meta[property='og:image:alt']", SITE.socialImageAlt);
  setMetaContent("meta[name='twitter:title']", SITE.ogTitle);
  setMetaContent("meta[name='twitter:description']", SITE.ogDescription);
  setMetaContent("meta[name='twitter:image']", absoluteUrl(SITE.socialImage));
  setMetaContent("meta[name='twitter:image:alt']", SITE.socialImageAlt);
  document.querySelector("link[rel='canonical']")?.setAttribute("href", SITE.canonicalUrl);

  shellElements.brand.textContent = SITE.header.name;
  shellElements.mark.textContent = SITE.header.mark;
  shellElements.contact.textContent = SITE.header.contactLabel;
  shellElements.contact.href = `mailto:${SITE.header.contactEmail}`;
  if (shellElements.intro) {
    const intro = (SITE.intro || "").trim();
    shellElements.intro.textContent = intro;
    shellElements.intro.hidden = intro === "";
  }
  shellElements.footerAboutTitle.textContent = SITE.footer.aboutTitle;
  shellElements.footerAboutText.replaceChildren(
    ...SITE.footer.aboutLines.flatMap((line, index) => {
      const nodes = [document.createTextNode(line)];
      if (index < SITE.footer.aboutLines.length - 1) {
        nodes.push(document.createElement("br"));
      }
      return nodes;
    })
  );
  shellElements.footerLocation.textContent = SITE.footer.location;
  renderLinkList(shellElements.footerSocialLinks, SITE.footer.socialLinks);
  renderLinkList(shellElements.footerRoleLinks, SITE.footer.roleLinks);
};

const normalizeMediaItem = (item) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const type = item.type || "image";
  return {
    ...item,
    type,
    source: item.source || item.src || ""
  };
};

const getProjectMedia = (project) => {
  if (Array.isArray(project.media) && project.media.length) {
    return project.media.map(normalizeMediaItem).filter(Boolean);
  }

  return (project.images || []).map((image) => normalizeMediaItem({ type: "image", ...image })).filter(Boolean);
};

const getPrimaryVisualMedia = (project) => {
  const media = getProjectMedia(project);
  return media[0] || null;
};

const getThumbnailSource = (item) => {
  const media = normalizeMediaItem(item);
  if (!media) {
    return null;
  }

  if (media.type === "image") {
    return media.thumbnail || media.src || media.source;
  }

  if (media.thumbnail) {
    return media.thumbnail;
  }

  if (media.type === "video" && media.provider?.toLowerCase() === "youtube") {
    const id = getYouTubeId(media.source);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  }

  return null;
};

const getMediaTypeLabel = (item) => {
  const media = normalizeMediaItem(item);
  return media?.type || "media";
};

const createMediaPlaceholder = (label) => {
  const placeholder = document.createElement("span");
  placeholder.className = "media-placeholder";
  placeholder.textContent = label;
  return placeholder;
};

const getYouTubeId = (source) => {
  try {
    const url = new URL(source);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }
    if (url.searchParams.get("v")) {
      return url.searchParams.get("v");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const embedIndex = parts.findIndex((part) => part === "embed" || part === "shorts");
    return embedIndex >= 0 ? parts[embedIndex + 1] || "" : "";
  } catch {
    return "";
  }
};

const getVimeoId = (source) => {
  try {
    const url = new URL(source);
    return url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part)) || "";
  } catch {
    return "";
  }
};

const createMediaFigureContent = (item, projectTitle) => {
  const media = normalizeMediaItem(item);
  const source = media?.source || "";

  if (!media || !source) {
    const empty = document.createElement("div");
    empty.className = "media-placeholder";
    empty.textContent = "Media unavailable";
    return empty;
  }

  if (media.type === "image") {
    const image = document.createElement("img");
    image.src = source;
    image.alt = media.alt || `${projectTitle} image`;
    if (media.width) {
      image.width = media.width;
    }
    if (media.height) {
      image.height = media.height;
    }
    image.loading = "eager";
    image.decoding = "async";
    return image;
  }

  if (media.type === "video") {
    if (media.provider === "youtube") {
      const id = getYouTubeId(source);
      if (id) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube-nocookie.com/embed/${id}`;
        iframe.title = media.caption || `${projectTitle} video`;
        iframe.loading = "lazy";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        return iframe;
      }
    }

    if (media.provider === "vimeo") {
      const id = getVimeoId(source);
      if (id) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://player.vimeo.com/video/${id}`;
        iframe.title = media.caption || `${projectTitle} video`;
        iframe.loading = "lazy";
        iframe.allow = "autoplay; fullscreen; picture-in-picture";
        iframe.allowFullscreen = true;
        return iframe;
      }
    }

    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    // Allow inline playback on iOS Safari instead of forcing fullscreen.
    video.playsInline = true;
    video.src = source;
    if (media.thumbnail) {
      video.poster = media.thumbnail;
    }
    return video;
  }

  if (media.type === "audio") {
    if (media.provider === "soundcloud") {
      const iframe = document.createElement("iframe");
      iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(source)}`;
      iframe.title = media.caption || `${projectTitle} audio`;
      iframe.loading = "lazy";
      iframe.allow = "autoplay";
      return iframe;
    }

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "metadata";
    audio.src = source;
    return audio;
  }

  const link = document.createElement("a");
  link.href = source;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = media.caption || "Open media";
  return link;
};

const createMediaCaption = (item) => {
  if (!item?.caption) {
    return null;
  }

  const caption = document.createElement("figcaption");
  caption.className = "project-detail__caption";
  caption.textContent = item.caption;
  return caption;
};

const createFilterButton = (filter) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-pill";
  button.dataset.filter = filter;
  button.textContent = labelForCategory(filter);
  button.setAttribute("aria-pressed", String(filter === state.activeLens));

  button.addEventListener("click", () => {
    setLens(filter);
  });

  return button;
};

const renderFilters = () => {
  elements.filterBar.replaceChildren(...PROJECT_LENSES.map(createFilterButton));
};

const markImageLoaded = (image) => {
  const setLoaded = () => image.classList.add("is-loaded");

  if (image.complete && image.naturalWidth > 0) {
    setLoaded();
    return;
  }

  image.addEventListener("load", setLoaded, { once: true });
  image.addEventListener("error", setLoaded, { once: true });
};

const isFullyExpanded = (totalProjects) => state.visibleCount >= totalProjects;

const updateLoadMoreButton = (totalProjects) => {
  const initialCount = getInitialProjectCount();
  const hasExpandableProjects = totalProjects > initialCount;
  const hasMore = state.visibleCount < totalProjects;
  const expanded = hasExpandableProjects && isFullyExpanded(totalProjects);

  elements.loadMoreButton.hidden = !hasExpandableProjects;
  elements.loadMoreButton.textContent = expanded ? "−" : "+";
  elements.loadMoreButton.setAttribute("aria-label", expanded ? "Show fewer projects" : "Load more projects");
  elements.loadMoreButton.title = expanded ? "Show fewer projects" : "Load more projects";
};

const announceProjectCount = (shown, total) => {
  if (state.activeLens === "all") {
    elements.projectStatus.textContent = `${shown} projects in chronological order.`;
    return;
  }

  const matching = publishedProjects.filter((project) => matchesLens(project, state.activeLens)).length;
  elements.projectStatus.textContent =
    `${matching} of ${total} projects relate to ${labelForCategory(state.activeLens)}. All projects remain available.`;
};

const applyLensToCard = (card, project) => {
  const lensIsActive = state.activeLens !== "all";
  const isMatch = matchesLens(project, state.activeLens);

  card.classList.toggle("is-lens-match", lensIsActive && isMatch);
  card.querySelectorAll("[data-category]").forEach((category) => {
    category.classList.toggle("is-active", category.dataset.category === state.activeLens);
  });
};

const closeImageLightbox = ({ restoreFocus = true } = {}) => {
  if (!restoreFocus) {
    state.lightboxTrigger = null;
  }

  if (elements.lightbox.open) {
    elements.lightbox.close();
  }
};

const openImageLightbox = (media, projectTitle, trigger) => {
  const source = media?.source || media?.src;
  if (!source) {
    return;
  }

  state.lightboxTrigger = trigger || document.activeElement;
  elements.lightboxImage.src = source;
  elements.lightboxImage.alt = media.alt || `${projectTitle} image`;
  if (media.width) {
    elements.lightboxImage.width = media.width;
  } else {
    elements.lightboxImage.removeAttribute("width");
  }
  if (media.height) {
    elements.lightboxImage.height = media.height;
  } else {
    elements.lightboxImage.removeAttribute("height");
  }
  elements.lightboxCaption.textContent = media.caption || "";
  elements.lightboxCaption.hidden = !media.caption;
  elements.lightbox.showModal();
  elements.lightboxClose.focus();
};

const createImageOpenButton = (media, projectTitle, image) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "project-detail__image-open";
  button.setAttribute("aria-label", "View image larger");
  button.title = "View image larger";

  const label = document.createElement("span");
  label.className = "project-detail__larger-label";
  label.textContent = "⤢";

  button.append(image, label);
  button.addEventListener("click", () => openImageLightbox(media, projectTitle, button));
  return button;
};

const renderProjects = () => {
  const visibleProjects = getVisibleProjects();
  const projectsToRender = visibleProjects.slice(0, state.visibleCount);
  const fragment = document.createDocumentFragment();

  projectsToRender.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.dataset.projectSlug = project.slug;
    card.style.setProperty("--card-index", String(index));
    if (!state.hasRenderedProjects) {
      card.classList.add("is-entering");
    }

    const anchor = document.createElement("a");
    anchor.className = "project-card__button";
    anchor.href = `${PROJECT_HASH_PREFIX}${encodeURIComponent(project.slug)}`;
    anchor.setAttribute("aria-controls", "project-inline");
    anchor.setAttribute("aria-expanded", "false");
    anchor.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      event.preventDefault();
      openProject(project, anchor);
    });

    const media = getPrimaryVisualMedia(project);
    const thumbnailSource = getThumbnailSource(media);
    const imageWrap = document.createElement("div");
    imageWrap.className = "project-card__image";
    imageWrap.style.setProperty("--thumb-position", project.thumbnailPosition || "center center");
    imageWrap.style.setProperty("--thumb-zoom", String(project.thumbnailZoom || 1));
    if (thumbnailSource) {
      const image = document.createElement("img");
      image.src = thumbnailSource;
      image.alt = media?.alt || `${project.title} thumbnail`;
      if (media?.width) {
        image.width = media.width;
      }
      if (media?.height) {
        image.height = media.height;
      }
      // Prioritise the first card (the likely LCP element) and lazy-load the rest.
      if (index === 0) {
        image.loading = "eager";
        image.fetchPriority = "high";
      } else {
        image.loading = "lazy";
      }
      image.decoding = "async";
      image.sizes = "(max-width: 520px) 100vw, (max-width: 860px) 50vw, (max-width: 1100px) 33vw, 25vw";
      markImageLoaded(image);
      imageWrap.append(image);
    } else {
      const placeholderLabel = media?.type && media.type !== "image" ? getMediaTypeLabel(media) : project.title;
      imageWrap.append(createMediaPlaceholder(placeholderLabel));
    }

    const body = document.createElement("div");
    body.className = "project-card__body";
    const title = document.createElement("h3");
    title.id = `project-title-${project.slug}`;
    title.textContent = project.title;
    const metadata = document.createElement("p");
    metadata.id = `project-meta-${project.slug}`;
    metadata.className = "project-card__meta";
    const year = document.createElement("span");
    year.textContent = project.year;
    metadata.append(year);
    project.categories.forEach((category) => {
      const categoryElement = document.createElement("span");
      categoryElement.className = "project-card__meta-category";
      categoryElement.dataset.category = category;
      categoryElement.textContent = labelForCategory(category);
      metadata.append(categoryElement);
    });
    const line = document.createElement("p");
    line.id = `project-description-${project.slug}`;
    line.className = "project-card__line";
    line.textContent = project.shortDescription;
    body.append(title, metadata, line);

    anchor.setAttribute("aria-labelledby", title.id);
    anchor.setAttribute("aria-describedby", `${metadata.id} ${line.id}`);
    anchor.append(imageWrap, body);
    card.append(anchor);
    applyLensToCard(card, project);
    fragment.append(card);
  });

  elements.projectGrid.replaceChildren(fragment);
  state.hasRenderedProjects = true;
  elements.loading.hidden = true;
  updateLoadMoreButton(visibleProjects.length);
  announceProjectCount(projectsToRender.length, visibleProjects.length);
};

const updateFeatureMedia = (item, projectTitle, featureTarget) => {
  const media = normalizeMediaItem(item);
  const content = createMediaFigureContent(media, projectTitle);
  const caption = createMediaCaption(media);
  const frame = document.createElement("div");
  frame.className = "project-detail__media-frame";
  frame.dataset.mediaType = media?.type || "unknown";
  if (media?.type === "image" && content instanceof HTMLImageElement) {
    frame.append(createImageOpenButton(media, projectTitle, content));
  } else {
    frame.append(content);
  }
  featureTarget.replaceChildren(...[frame, caption].filter(Boolean));
};

const renderGallery = (project, galleryTarget, featureTarget) => {
  const mediaItems = getProjectMedia(project);

  if (mediaItems.length <= 1) {
    galleryTarget.replaceChildren();
    galleryTarget.hidden = true;
    return;
  }

  galleryTarget.hidden = false;
  const fragment = document.createDocumentFragment();

  mediaItems.forEach((item, index) => {
    const thumbnailSource = getThumbnailSource(item);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gallery-thumb";
    button.dataset.mediaType = item.type || "media";
    button.setAttribute("aria-label", `Show ${item.type || "media"} ${index + 1} for ${project.title}`);
    button.setAttribute("aria-pressed", String(index === 0));

    if (thumbnailSource) {
      const image = document.createElement("img");
      image.src = thumbnailSource;
      image.alt = item.alt || item.caption || `${project.title} media ${index + 1}`;
      if (item.width) {
        image.width = item.width;
      }
      if (item.height) {
        image.height = item.height;
      }
      image.loading = "lazy";
      image.decoding = "async";
      image.sizes = "160px";
      button.append(image);
    } else {
      const label = document.createElement("span");
      label.className = "gallery-thumb__label";
      label.textContent = getMediaTypeLabel(item);
      button.append(label);
    }

    button.addEventListener("click", () => {
      updateFeatureMedia(item, project.title, featureTarget);
      galleryTarget.querySelectorAll(".gallery-thumb").forEach((thumb) => {
        thumb.setAttribute("aria-pressed", String(thumb === button));
      });
    });

    fragment.append(button);
  });

  galleryTarget.replaceChildren(fragment);
};

const renderProjectDetail = (project) => {
  updateFeatureMedia(getProjectMedia(project)[0], project.title, inlineElements.featureMedia);
  renderGallery(project, inlineElements.gallery, inlineElements.featureMedia);

  inlineElements.kicker.textContent = `${project.projectType} / ${project.year}`;
  inlineElements.title.textContent = project.title;
  inlineElements.year.textContent = project.year;
  inlineElements.role.textContent = project.role;
  inlineElements.type.textContent = project.projectType;

  inlineElements.tags.replaceChildren(
    ...project.categories.map((tag) => {
      const item = document.createElement("li");
      item.textContent = labelForFilter(tag);
      return item;
    })
  );

  inlineElements.description.replaceChildren(
    ...project.fullDescription.map((paragraph) => {
      const element = document.createElement("p");
      element.textContent = paragraph;
      return element;
    })
  );

  const linksFragment = document.createDocumentFragment();
  project.links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.textContent = link.label;
    if (link.url.startsWith("mailto:")) {
      anchor.target = "_self";
    } else {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
    }
    linksFragment.append(anchor);
  });
  inlineElements.links.replaceChildren(linksFragment);
  inlineElements.links.hidden = project.links.length === 0;
};

// Distinguishes three cases explicitly rather than collapsing them into one
// empty-string result: a hash outside our namespace ("none"), a hash inside
// our namespace that decoded to a slug ("valid" — which may or may not match
// a real project), and a hash inside our namespace that failed to decode
// ("malformed", e.g. bad percent-encoding like "#project=%E").
const parseProjectHash = () => {
  if (!location.hash.startsWith(PROJECT_HASH_PREFIX)) {
    return { kind: "none" };
  }

  const encoded = location.hash.slice(PROJECT_HASH_PREFIX.length);
  try {
    return { kind: "valid", slug: decodeURIComponent(encoded) };
  } catch {
    return { kind: "malformed" };
  }
};

const findProjectBySlug = (slug) =>
  publishedProjects.find((project) => project.slug === slug) || null;

const clearProjectHashSilently = () => {
  history.replaceState(null, "", location.pathname + location.search);
};

const resetInlinePresentation = () => {
  elements.projectGrid.classList.remove("has-inline-detail");
  elements.projectGrid.querySelectorAll(".project-card.is-selected").forEach((card) => {
    card.classList.remove("is-selected");
    card.querySelector("[aria-expanded]")?.setAttribute("aria-expanded", "false");
  });
  elements.inlineDetail.hidden = true;
  elements.projectGrid.after(elements.inlineDetail);
};

const presentInlineProject = (project, trigger) => {
  if (trigger || state.openProjectMode !== "inline") {
    state.lastTrigger = trigger || document.activeElement;
  }

  state.openProjectSlug = project.slug;
  state.openProjectMode = "inline";

  renderProjectDetail(project);
  resetInlinePresentation();

  const card = elements.projectGrid.querySelector(`[data-project-slug="${project.slug}"]`);
  const projectLink = card?.querySelector(".project-card__button");
  card?.classList.add("is-selected");
  projectLink?.setAttribute("aria-expanded", "true");
  if (card) {
    card.after(elements.inlineDetail);
  }
  elements.projectGrid.classList.add("has-inline-detail");
  elements.inlineDetail.hidden = false;
  elements.projectStatus.textContent = `${project.title} details opened in the project field.`;

  if (trigger) {
    // Interactive open (a project card/link activated in-page): the trigger
    // already has focus and the project unfolds in place, so keyboard focus
    // is deliberately left alone rather than redirected anywhere.
    return;
  }

  // Direct/deep-link open (initial load landing on a project hash, or a
  // hashchange/popstate reconciling to one) has no in-page trigger to
  // preserve focus on. Land focus on the detail's own heading — a real
  // content landmark, not the Close control — and let the browser's default
  // focus-triggered scroll bring the expanded project into view. The
  // heading is focusable only programmatically (tabindex="-1" in markup),
  // never part of ordinary Tab order.
  inlineElements.title.focus();
};

// Path A (explicit user action: Close button, Escape) owns history mutation.
// Path B (URL/location synchronization reconciling the open project to
// whatever the address bar currently shows — Back/Forward, invalid-hash
// normalization, or a hash outside our namespace) must be able to close the
// project detail without ever touching history itself. `updateHistory` makes
// that distinction explicit at every call site instead of inferring it from
// whatever the hash currently happens to be.
const dismissProject = ({ updateHistory, restoreFocus = true }) => {
  // Closing already-closed UI happens legitimately: `history.back()` below,
  // when it consumes a locally-pushed entry, lands back on a hashless entry
  // and fires its own popstate, which reconciles here a second time after
  // this function has already finished tearing everything down. Without this
  // guard that second pass would repeat the teardown and, since
  // `lastTrigger`/the push flag are already cleared, do so with stale state.
  if (!updateHistory && state.openProjectSlug === null && state.openProjectMode === null) {
    return;
  }

  const trigger = state.lastTrigger;
  const wasPushedLocally = state.projectHashPushedLocally;
  state.lastTrigger = null;
  state.openProjectSlug = null;
  state.openProjectMode = null;
  state.projectHashPushedLocally = false;
  closeImageLightbox({ restoreFocus: false });
  resetInlinePresentation();
  if (updateHistory && location.hash.startsWith(PROJECT_HASH_PREFIX)) {
    // Prefer consuming the entry opening pushed, so Back lands on whatever
    // meaningfully preceded it instead of a second, duplicate closed state.
    // Only safe when this session did the pushing (see `projectHashPushedLocally`)
    // — otherwise (a direct deep link, or a reload while deep-linked) there is
    // no guarantee a previous entry belongs to this site at all.
    if (wasPushedLocally) {
      history.back();
    } else {
      clearProjectHashSilently();
    }
  }
  announceProjectCount(publishedProjects.length, publishedProjects.length);
  if (restoreFocus && trigger instanceof HTMLElement && trigger.isConnected) {
    trigger.focus({ preventScroll: true });
  }
};

const openProject = (project, trigger) => {
  // Captured before presentInlineProject() mutates it: switching directly
  // from one open project to another (both visible in the same grid) is a
  // real path, not just closed -> open.
  const previousSlug = state.openProjectSlug;
  presentInlineProject(project, trigger);
  const targetHash = PROJECT_HASH_KEY + project.slug;
  if (location.hash === `#${targetHash}`) {
    return;
  }

  if (previousSlug && previousSlug !== project.slug) {
    // Switching directly between two open projects must replace the hash in
    // place. Pushing a second entry here would leave the first project's
    // entry sitting in history as a dead middle step between the pre-open
    // page and this one — the same failure `dismissProject` already guards
    // against on Close, but on the open side.
    history.replaceState(null, "", location.pathname + location.search + `#${targetHash}`);
    return;
  }

  // This push is what a subsequent explicit Close needs to consume with
  // `history.back()` rather than replace in place; record it before the
  // hashchange it triggers reconciles below and no-ops on an already-open
  // match.
  state.projectHashPushedLocally = true;
  location.hash = targetHash;
};

const closeProject = () => {
  dismissProject({ updateHistory: true });
};

// The single reconciliation function driving both hashchange and popstate.
// It only ever reads the current location and never pushes/replaces history
// itself, except to clean up our own invalid namespaced hashes (case 2).
//
// `event` is only used to tell apart the initial, direct call made once at
// startup (`event` undefined — the page loaded straight onto whatever hash is
// in the address bar, via a deep link or a reload) from every later call,
// which is always a real hashchange/popstate firing in an already-running
// page. Only in the latter case is the entry immediately behind the one we
// are about to open guaranteed to be a same-session portfolio state, so only
// there is it safe to mark the project as locally pushed for `closeProject`.
const syncProjectWithLocation = (event) => {
  const parsed = parseProjectHash();

  if (parsed.kind === "none") {
    // Case 3: outside our namespace (e.g. "#top", or no hash at all). Any
    // open project UI is stale and should close, but the hash itself — and
    // native browser anchor behavior — must be left completely untouched.
    dismissProject({ updateHistory: false });
    return;
  }

  const project = parsed.kind === "valid" ? findProjectBySlug(parsed.slug) : null;

  if (!project) {
    // Case 2: inside our namespace but invalid — unknown slug, draft slug,
    // or malformed percent-encoding. This is ours to normalize away.
    dismissProject({ updateHistory: false });
    clearProjectHashSilently();
    return;
  }

  // Case 1: a valid, published project.
  if (state.openProjectSlug === parsed.slug && state.openProjectMode) {
    return;
  }

  // Reopening via a real hashchange/popstate (Forward back into a pushed
  // entry, or a hash typed straight into the address bar) still guarantees a
  // same-session entry sits immediately behind this one. Only the initial,
  // event-less call — landing on this hash with no prior in-page navigation —
  // cannot make that guarantee.
  state.projectHashPushedLocally = Boolean(event);
  presentInlineProject(project);
};

const setLens = (lens) => {
  state.activeLens = lens;

  elements.filterBar.querySelectorAll(".filter-pill").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === lens);
    button.setAttribute("aria-pressed", String(button.dataset.filter === lens));
  });

  elements.projectGrid.querySelectorAll(".project-card").forEach((card) => {
    const project = findProjectBySlug(card.dataset.projectSlug);
    if (project) {
      applyLensToCard(card, project);
    }
  });
  announceProjectCount(publishedProjects.length, publishedProjects.length);
};

const toggleProjectCount = () => {
  const visibleProjects = getVisibleProjects();
  const shouldCollapse = isFullyExpanded(visibleProjects.length);

  state.visibleCount = shouldCollapse
    ? getInitialProjectCount()
    : Math.min(visibleProjects.length, state.visibleCount + getProjectRevealCount());

  renderProjects();

  if (shouldCollapse) {
    document.querySelector("#work")?.scrollIntoView({
      behavior: reducedMotionQuery.matches ? "auto" : "smooth",
      block: "start"
    });
  }
};

elements.loadMoreButton.addEventListener("click", toggleProjectCount);

elements.inlineClose.addEventListener("click", closeProject);

elements.lightboxClose.addEventListener("click", () => closeImageLightbox());

elements.lightbox.addEventListener("click", (event) => {
  if (event.target === elements.lightbox || event.target.classList.contains("image-lightbox__figure")) {
    closeImageLightbox();
  }
});

elements.lightbox.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeImageLightbox();
});

elements.lightbox.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeImageLightbox();
  }
});

elements.lightbox.addEventListener("close", () => {
  elements.lightboxImage.removeAttribute("src");
  elements.lightboxCaption.textContent = "";
  const trigger = state.lightboxTrigger;
  state.lightboxTrigger = null;
  if (trigger instanceof HTMLElement) {
    trigger.focus();
  }
});

document.addEventListener("keydown", (event) => {
  if (
    event.key !== "Escape" ||
    state.openProjectMode !== "inline" ||
    (event.target instanceof Element && event.target.closest("#image-lightbox"))
  ) {
    return;
  }

  event.preventDefault();
  closeProject();
});

renderSiteShell();
renderFilters();
resetVisibleCount();
renderProjects();
setLens("all");

window.addEventListener("hashchange", syncProjectWithLocation);
window.addEventListener("popstate", syncProjectWithLocation);
syncProjectWithLocation();

const markPageReady = () => {
  document.body.classList.remove("is-building");
  document.body.classList.add("is-ready");
};

if (reducedMotionQuery.matches) {
  markPageReady();
} else {
  window.requestAnimationFrame(markPageReady);
}
