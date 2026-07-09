const FENCE_ROUTE = "/concrete-fence-post-calculator";

const FENCE_TITLE = "Fence Post Concrete Calculator | Bag & Volume Estimator";
const FENCE_DESCRIPTION =
  "Calculate exactly how many 80lb, 60lb, or 20kg bags of concrete you need for fence posts and sonotubes. Accurately factors in lumber post displacement.";

const FENCE_SEO_HTML = `<section class="seo-content" style="max-width: 800px; margin: 2rem auto; padding: 1rem; font-family: sans-serif; line-height: 1.6;">
    <h2>How Many Bags of Concrete Do I Need for a Fence Post?</h2>
    <p>When setting a standard fence post, the amount of concrete premix you need depends entirely on the depth and diameter of your hole. For most backyard projects, anchoring a standard 4x4 post or a mailbox post requires roughly 1 to 2 bags of 80lb concrete premix to anchor securely into the soil structure.</p>
    <h3>Calculating Concrete for a 4x4 Post vs 6x6 Post</h3>
    <p>A standard 4x4 lumber post actually measures 3.5 inches by 3.5 inches, while a heavy-duty 6x6 post measures 5.5 inches by 5.5 inches. Our estimator tool automatically subtracts this buried lumber volume displacement from your total cylinder calculation. If you do not subtract the buried wood volume, you will end up buying more concrete bags than necessary.</p>
    <h3>Using an 8 Inch Sonotube or Concrete Form</h3>
    <p>If you are pouring structural deck footings or columns using a cylindrical cardboard tube, an 8 inch sonotube dug to a depth of 24 inches will require roughly 0.70 cubic feet of concrete volume. This translates to just over 1 bag of 60lb mix or exactly 1 bag of 80lb concrete mix per hole, including a baseline 10% wastage margin for soil irregularities.</p>
    <h2 style="margin-top: 2.5rem;">Frequently Asked Post Hole Math Questions</h2>
    <div class="faq-item" style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">How many 50lb bags of concrete do I need for a fence post?</h4>
        <p>A standard 10-inch diameter hole dug 24 inches deep requires about 1.5 to 2 bags of 50lb concrete premix. Because 50lb bags contain less overall volume (approx. 0.37 cubic feet) than standard 80lb bags, you will need to buy roughly 60% more individual retail bags total if choosing this size layout.</p>
    </div>
    <div class="faq-item" style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">How many 20kg bags of concrete for a post hole?</h4>
        <p>For a standard fence post hole (250mm diameter by 600mm deep), you will need approximately 2 bags of 20kg dry concrete mix. If you swap our calculator from 'Imperial' to 'Metric' mode at the top of the page, it will instantly display your total volume in cubic meters and output exact metric bag requirements.</p>
    </div>
    <div class="faq-item" style="margin-bottom: 1.5rem;">
        <h4 style="margin-bottom: 0.5rem; font-size: 1.1rem;">How many posts will a 20kg bag of postcrete do?</h4>
        <p>Generally, one 20kg bag of postcrete or fast-set post mix will anchor one standard wooden fence post in a narrow hole. However, if your hole is dug to professional structural specifications (three times the width of the post), you will likely need 1.5 to 2 bags of 20kg postcrete per post hole to fill it properly to ground level.</p>
    </div>
</section>`;

/**
 * Swap the <title>...</title> contents.
 */
function replaceTitle(html, newTitle) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${newTitle}</title>`);
}

/**
 * Swap the content="" attribute of <meta name="description" ...>.
 */
function replaceMetaDescription(html, newDescription) {
  return html.replace(
    /(<meta\s+name=["']description["']\s+content=")([\s\S]*?)(")/i,
    `$1${newDescription}$3`
  );
}

/**
 * Inject the fence-post SEO block directly after the #appcard container's
 * closing </main> tag, and hide the homepage's generic .seo section so the
 * two blocks don't compete on the fence-post page.
 */
function injectFenceSeo(html) {
  // The appcard container is a <main id="appcard" ...> ... </main> block.
  // Insert the new section right after that closing tag.
  const appcardCloseRegex = /(<main[^>]*id=["']appcard["'][\s\S]*?<\/main>)/;

  if (appcardCloseRegex.test(html)) {
    html = html.replace(appcardCloseRegex, `$1\n${FENCE_SEO_HTML}`);
  }

  // Hide the default homepage SEO section (slab/patio focused) on this route.
  html = html.replace(
    /<section class="seo">/,
    '<section class="seo" hidden>'
  );

  return html;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === FENCE_ROUTE) {
      // Fetch the standard index.html from the static asset bindings.
      const assetUrl = new URL("/index.html", url.origin);
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));

      // Only transform successful HTML responses.
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || !contentType.includes("text/html")) {
        return response;
      }

      let html = await response.text();

      html = replaceTitle(html, FENCE_TITLE);
      html = replaceMetaDescription(html, FENCE_DESCRIPTION);
      html = injectFenceSeo(html);

      return new Response(html, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Default: serve static assets as-is (homepage and everything else).
    return env.ASSETS.fetch(request);
  },
};
