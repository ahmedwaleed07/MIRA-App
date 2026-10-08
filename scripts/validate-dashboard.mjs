import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(file, 'utf8');
function ensure(condition, message) {
  if (!condition) throw new Error('Dashboard validation: ' + message);
}
const css = read('docs/dashboard-sections.css');
const brand = ['#FC618F', '#800020', '#FFFFFF'];
const colors = [...new Set(css.match(/#[a-fA-F0-9]{6}\b/g) || [])];
ensure(colors.every(color => brand.includes(color.toUpperCase())), 'non-brand color in dashboard styles');
ensure((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length, 'unbalanced CSS');
ensure(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'), 'desktop grid is not 3 columns');
ensure(css.includes('@media(max-width:760px)') && css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'), 'mobile grid is not 2 columns');
ensure(css.includes('width:46px!important;height:46px!important'), 'icon container has no fixed 46px size');
ensure(css.includes('width:25px!important;height:25px!important'), 'icon is not fixed to 25px');
ensure(css.includes('overflow-wrap:break-word!important'), 'long card titles may overflow');
ensure(!/\.brandmark|mira_wordmark|\.logo\b/.test(css), 'dashboard CSS must not change MIRA logo');

const cases = [
  {
    file: 'docs/business.html', attr: 'scroll', names: [
      'Store Profile', 'Products & Services', 'Orders',
      'Offers', 'Media Assets', 'Performance',
    ],
  },
  {
    file: 'docs/admin.html', attr: 'go', names: [
      'Stores', 'Products & Services', 'Categories', 'Orders',
      'Flash Sales / Offers', 'Media Assets', 'Placement Model', 'Performance',
    ],
  },
];

for (const { file, attr, names } of cases) {
  const html = read(file);
  const quick = html.match(/<div class="ecosystem-quick dashboard-grid"[^>]*>([\s\S]*?)<\/div>/);
  ensure(quick, file + ': quick-access grid missing');
  const buttons = [...quick[1].matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0]);
  ensure(buttons.length === names.length, file + ': expected ' + names.length + ' cards, got ' + buttons.length);
  const foundNames = buttons.map(button => (button.match(/<strong>([^<]+)<\/strong>/) || [])[1]);
  ensure(JSON.stringify(foundNames) === JSON.stringify(names),
    file + ': card order changed: ' + JSON.stringify(foundNames));
  ensure(html.includes('mira-pink-theme.css?v=') && html.includes('dashboard-sections.css?v='),
    file + ': stylesheet links missing');
  ensure(html.indexOf('dashboard-sections.css?v=') > html.indexOf('mira-pink-theme.css?v='),
    file + ': dashboard overrides must be loaded last');
  for (const [i, button] of buttons.entries()) {
    ensure(button.includes('class="dashboard-tile"'), file + ': missing class on card ' + i);
    ensure((button.match(/\bclass=/g) || []).length === 1, file + ': duplicate class attributes on card ' + i);
    ensure(/<span class="ecosystem-icon"><svg[^>]+>[\s\S]*?<\/svg><\/span>/.test(button),
      file + ': missing icon on card ' + i);
    ensure(/<\/strong><span>[^<]+<\/span>/.test(button), file + ': missing subtitle on card ' + i);
    const action = button.match(new RegExp('data-' + attr + '="([^"]+)"'));
    ensure(action, file + ': action missing on card ' + i);
    ensure(html.includes('id="' + action[1] + '"'), file + ': action target missing ' + action[1]);
    if (button.includes('data-focus=')) {
      const target = button.match(/data-focus="([^"]+)"/);
      ensure(target && html.includes('id="' + target[1] + '"'),
        file + ': focused dashboard target missing');
    }
  }
  console.log('PASS ' + file + ': ' + buttons.length + ' responsive cards, links and icons validated.');
}
