const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters
    .replace(/\s+/g, '-'); // Replace spaces with hyphens

export default function headingWithId(md) {
  const defaultRender = md.renderer.rules.heading_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
    const headingText = tokens[idx + 1].content;
    const slug = slugify(headingText);
    tokens[idx].attrs = tokens[idx].attrs || [];
    tokens[idx].attrs.push(['id', slug]);
    return defaultRender(tokens, idx, options, env, self);
  };
}

