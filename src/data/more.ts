import type { Question } from '../types';
export type Q = [string, string[], number, string];
export type Item = Q | (Partial<Question> & { q: string });
export interface Def { id: number; title: string; icon: string; cat: string; topics: [string, string]; qs: Item[] }
const M = (q: string, pairs: [string, string][], e = 'Match each pair.'): Item => ({ q, k: 'match', pairs, e });
const F = (q: string, blanks: string[], e: string): Item => ({ q, k: 'fill', blanks, e });
const O = (q: string, items: string[], e: string): Item => ({ q, k: 'order', items, e });
const T = (q: string, kw: string[], e: string): Item => ({ q, k: 'text', kw, e });
const svg = (s: string) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 120'>${s}</svg>`);
const S = "stroke='#17142a' stroke-width='4'";
const IMG = {
  tri: svg(`<polygon points='20,100 170,100 20,20' fill='#ffb938' ${S}/><path d='M20 84h16v16' fill='none' stroke='#17142a' stroke-width='3'/>`),
  hex: svg(`<polygon points='110,8 160,34 160,86 110,112 60,86 60,34' fill='#2fd3a8' ${S}/>`),
  rect: svg(`<rect x='30' y='20' width='140' height='80' fill='#8b7bff' ${S}/><text x='100' y='14' font-size='14' text-anchor='middle'>6 cm</text><text x='178' y='64' font-size='14'>4 cm</text>`),
  circ: svg(`<circle cx='110' cy='60' r='48' fill='#ff7a66' ${S}/><line x1='110' y1='60' x2='158' y2='60' ${S}/><text x='114' y='52' font-size='14'>r = 5 cm</text>`),
};
const im = (img: string, x: Q): Item => ({ q: x[0], o: x[1], a: x[2], e: x[3], img });
export const MORE: Def[] = [
{ id: 21, title: 'React Fundamentals', icon: '⚛️', cat: 'Tech', topics: ['Components', 'Hooks'], qs: [
 ['Components must return:', ['Elements (JSX)', 'Only strings', 'A database row', 'CSS'], 0, 'A component returns elements describing the UI.'],
 F('useState returns a value and a ___ function.', ['setter|setstate|set function'], 'useState returns [state, setState].'),
 ['What does the key prop help React with?', ['Styling', 'Identifying list items across renders', 'Routing', 'Security'], 1, 'Keys let React match list items between renders.'],
 M('Match the hook to its use', [['useState', 'Local state'], ['useEffect', 'Side effects'], ['useRef', 'Mutable value that persists'], ['useMemo', 'Cache a computed value']]),
 O('Order the React update cycle', ['Trigger', 'Render', 'Commit', 'Effects run'], 'Trigger → render → commit to the DOM → effects.'),
 T('In a sentence: why should you not mutate state directly?', ['render', 'new|copy|immutable', 'state'], 'React compares references; mutate in place and it may skip re-rendering. Set a new copy instead.')] },
{ id: 22, title: 'Cloud & DevOps', icon: '☁️', cat: 'Tech', topics: ['Docker', 'CI/CD'], qs: [
 ['Which file describes how to build a Docker image?', ['docker-compose.yml', 'Dockerfile', 'package.json', 'Jenkinsfile'], 1, 'A Dockerfile lists the build steps.'],
 ['What does CI stand for?', ['Continuous Integration', 'Code Inspection', 'Central Index', 'Cloud Instance'], 0, 'Continuous Integration: merge and test often.'],
 F('docker compose ___ starts every service in the file.', ['up'], '`docker compose up` starts the stack.'),
 M('Match the tool to its role', [['Jenkins', 'CI/CD server'], ['Prometheus', 'Metrics collection'], ['Grafana', 'Dashboards'], ['Git', 'Version control']]),
 O('Order a Docker workflow', ['Write Dockerfile', 'Build image', 'Run container', 'Push to registry'], 'Write, build, run, then publish.'),
 T('Why does a CI pipeline run tests on every push?', ['bug|error|fail|break', 'early|fast|quick|immediately', 'merge|main|team'], 'It catches breakage early, before code is merged.')] },
{ id: 23, title: 'Linux & Terminal', icon: '🐧', cat: 'Tech', topics: ['Commands', 'Files'], qs: [
 ['Which command lists files?', ['ls', 'cd', 'rm', 'cat'], 0, 'ls lists directory contents.'],
 ['Which command prints the current directory?', ['pwd', 'echo', 'mv', 'chmod'], 0, 'pwd = print working directory.'],
 F('Use ___ to change into another directory.', ['cd'], 'cd = change directory.'),
 ['What does chmod change?', ['File permissions', 'File name', 'Disk size', 'Owner password'], 0, 'chmod sets read/write/execute permissions.'],
 M('Match command to action', [['grep', 'Search text'], ['mkdir', 'Create a folder'], ['rm', 'Delete a file'], ['cat', 'Show file contents']]),
 O('Order the steps to run a script', ['Write script.sh', 'chmod +x script.sh', './script.sh'], 'Create it, make it executable, then run it.')] },
{ id: 24, title: 'Periodic Table', icon: '🧫', cat: 'Science', topics: ['Elements', 'Groups'], qs: [
 ['Symbol for sodium?', ['Na', 'So', 'Sd', 'N'], 0, 'Na, from Latin natrium.'],
 ['Noble gases sit in group:', ['18', '1', '17', '2'], 0, 'Group 18 (helium, neon, argon…).'],
 M('Match element and symbol', [['Iron', 'Fe'], ['Potassium', 'K'], ['Silver', 'Ag'], ['Lead', 'Pb']]),
 F('Halogens are in group ___.', ['17'], 'Fluorine, chlorine, bromine… are group 17.'),
 O('Order by atomic number (lowest first)', ['Hydrogen', 'Carbon', 'Oxygen', 'Neon'], 'H = 1, C = 6, O = 8, Ne = 10.'),
 T('Why are noble gases mostly unreactive?', ['full|complete|filled|stable', 'electron|shell|valence'], 'Their outer electron shell is full, so they rarely bond.')] },
{ id: 25, title: 'Grammar & Vocabulary', icon: '📚', cat: 'Language', topics: ['Grammar', 'Vocabulary'], qs: [
 ['Choose the correct sentence.', ['She go to school.', 'She goes to school.', 'She going to school.', 'She gone school.'], 1, 'Third person singular takes -s.'],
 ['A synonym of "happy" is:', ['Sad', 'Joyful', 'Angry', 'Tired'], 1, 'Joyful means happy.'],
 F('He ___ (go) to the market yesterday.', ['went'], 'Past tense of go is went.'),
 M('Match each word with its opposite', [['Ancient', 'Modern'], ['Expand', 'Shrink'], ['Victory', 'Defeat'], ['Generous', 'Selfish']]),
 O('Arrange into a sentence', ['The', 'quick', 'brown', 'fox', 'jumps'], 'The quick brown fox jumps.'),
 T('Write one sentence using the word "resilient".', ['resilient'], 'Any correct use works, e.g. "She stayed resilient after setbacks."')] },
{ id: 26, title: 'Shapes & Diagrams', icon: '🖼️', cat: 'Math', topics: ['Shapes', 'Measurement'], qs: [
 im(IMG.tri, ['What kind of triangle is shown?', ['Right-angled', 'Equilateral', 'Obtuse', 'Isosceles'], 0, 'It has a 90° corner.']),
 im(IMG.rect, ['Find the area of this rectangle.', ['24 cm²', '20 cm²', '10 cm²', '48 cm²'], 0, '6 × 4 = 24.']),
 F('A circle\'s diameter is twice its ___.', ['radius'], 'd = 2r.'),
 im(IMG.circ, ['Circumference of this circle (π = 3.14)?', ['31.4 cm', '15.7 cm', '78.5 cm', '10 cm'], 0, '2πr = 2 × 3.14 × 5 = 31.4.']),
 M('Match shape to number of sides', [['Triangle', '3'], ['Pentagon', '5'], ['Octagon', '8'], ['Hexagon', '6']]),
 im(IMG.hex, ['How many sides does this shape have?', ['5', '6', '7', '8'], 1, 'A hexagon has six sides.'])] },
{ id: 27, title: 'Health & Nutrition', icon: '🥗', cat: 'Science', topics: ['Nutrition', 'Fitness'], qs: [
 ['Which nutrient helps build muscle?', ['Protein', 'Sugar', 'Salt', 'Fibre'], 0, 'Protein supplies amino acids.'],
 ['WHO recommends at least how many minutes of moderate activity a week for adults?', ['150', '30', '500', '60'], 0, 'At least 150 minutes.'],
 M('Match vitamin to source', [['Vitamin C', 'Citrus fruits'], ['Vitamin D', 'Sunlight'], ['Vitamin A', 'Carrots'], ['Vitamin B12', 'Dairy and meat']]),
 F('Resting heart rate is measured in ___ per minute.', ['beats|bpm'], 'Beats per minute.'),
 T('Name one reason fibre matters in the diet.', ['digest|gut|bowel', 'cholesterol|sugar|full|satiety'], 'Fibre supports digestion and helps you feel full.'),
 O('Order a healthy workout', ['Warm up', 'Main exercise', 'Cool down', 'Stretch'], 'Warm up, train, cool down, stretch.')] },
{ id: 28, title: 'Aptitude & Speed Math', icon: '⏱️', cat: 'Math', topics: ['Arithmetic', 'Percentages'], qs: [
 ['12 × 8 =', ['96', '86', '108', '88'], 0, '12 × 8 = 96.'],
 ['10% of 250 =', ['25', '2.5', '50', '20'], 0, 'Divide by 10.'],
 F('144 ÷ 12 = ___', ['12'], '12 × 12 = 144.'),
 ['A ₹800 shirt is 25% off. New price?', ['₹600', '₹650', '₹700', '₹200'], 0, '25% of 800 = 200; 800 − 200 = 600.'],
 O('Order smallest to largest', ['1/4', '0.3', '40%', '0.75'], '0.25 < 0.3 < 0.4 < 0.75.'),
 M('Match fraction and percent', [['1/2', '50%'], ['1/5', '20%'], ['3/4', '75%'], ['1/8', '12.5%']])] },
];
