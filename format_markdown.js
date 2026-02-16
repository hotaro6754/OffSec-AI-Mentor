function formatMarkdown(text) {
    if (!text) return '';

    // Basic HTML escaping for safety
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert links: [text](url)
    let html = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="res-link-inline">$1</a>');

    // Convert bold: **text** or __text__
    html = html.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

    // Convert code: \`text\`
    html = html.replace(/\`(.*?)\`/g, '<code>$1</code>');

    // Convert newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
}
