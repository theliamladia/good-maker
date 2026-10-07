// STUDY®: GOOD®'s journal. One entry per post, newest first.
// After editing, run `node tools/build-study.js`: it writes study.html (the
// archive) and study/<slug>.html (each post) as static pages, so search
// engines and link previews see the full text, images and metadata.
// Post bodies are written here by us, so their HTML is trusted; comments never
// are (see api/comments.js and js/study-comments.js).
//
// Blocks in body:
//   { p }                    a paragraph (HTML); the first one gets the drop cap
//   { note }                 a small italic note (e.g. "edited and condensed")
//   { q }                    an interview question
//   { quote }                a pull quote
//   { fig, alt, caption }    a full-width figure
//   { pair: [{ img, alt }], caption }   two or three images side by side
//   { gallery: [{ img, label, sub }], title, caption }   a labelled grid
//   { head }                 a section heading
//   { wrap, alt, w }         a shape floated left; the following text wraps around its outline
//   { end: true }            the end mark after the last paragraph
const STUDY = [
  {
    slug: 'old-g-to-new-g',
    rubric: 'STUDY® / DESIGN',
    title: 'OLD G® TO NEW G®',
    dek: 'Why the G changed, and what didn’t.',
    byline: 'GOOD® DESIGN',
    date: '2026-10-07',
    description: 'Three generations of the GOOD® G: the narrow Gen 0, the square, brutalist Gen 1, and the open new G. Why it changed, and what never will.',
    lead: {
      img: '/assets/study/g-lineup.png',
      alt: 'BobaYeet in SHIRT® I looking off to the side; Chinny in CROPPIE® I DUST PINK pointing at the G, red tartan boxers showing; Austin1333 in DOUBBIE® I GOOD® BLUE adjusting the hood.',
      caption: 'The Gen 1 G, three ways. BobaYeet in SHIRT® I with JEAN® SAGGING PATENT™ and SNEAK01; Chinny in CROPPIE® I DUST PINK™ with HIGHLAND™ boxers, JEAN® SAGGING SPRINGSTEEN™ and TOBACCO™; Austin1333 in DOUBBIE® I GOOD® BLUE™ with JEAN® SAGGING PATENT™ and TUXEDO™.',
    },
    og: '/assets/study/og-old-g-to-new-g.png?v=2',
    thumb: '/assets/study/g-lineup.png',
    body: [
      { p: 'The G started in Minecraft. Before it was ever on a shirt, it was on our builds: a huge, square G on the side of a GOOD® building. We were deep into brutalism at the time, and we wanted something monolithic, a mark that looked like it had been carved out of a single block.' },

      { head: 'Gen 0' },
      { wrap: '/assets/study/g-shape-0.png', alt: 'The Gen 0 G: three pixels wide and four tall.', w: 186 },
      { p: 'The first G on the first shirt was a lot narrower. Three pixels wide and four tall, sitting a pixel left of centre on an eight-pixel chest. It said GOOD®, but it was a little off balance, and you could feel it every time you looked at the shirt.' },

      { head: 'Gen 1' },
      { wrap: '/assets/study/g-shape-1.png', alt: 'The Gen 1 G: four by four, square and closed.', w: 256 },
      { p: 'So we turned it into Gen 1. A little more square, a little stronger, and centred. Closed off and very brutalist. When you put the whole shirt together it read as one solid block, which was exactly what we were after.' },
      { p: 'Gen 1 is the G on SHIRT® I, CROPPIE® I and DOUBBIE® I, and on the BABY® pieces that were made in that generation.' },

      { head: 'The new G' },
      { wrap: '/assets/study/g-shape-2.png', alt: 'The new G: four by four, with the corners taken away.', w: 280 },
      { p: 'The new G is open and minimal. We stripped away everything that wasn’t necessary. The corners are gone, and what is left is the cleanest G we can make without it looking ambiguous.' },
      { p: 'Designing for a 64 by 64 skin shaped it, on Classic arms and on Slim. The old G felt too big. It was a neon sign. If GOOD® is going to be something you can just put on without worrying about looking like a billboard, it has to be normal. Timeless. A fixture in your life.' },
      { p: 'A lot of what we chase when we make these things is the ubiquitous: something so common it folds into everyday life, timeless, and still unique enough to stand out. The new G is still a big logo, but it sits cleaner on the fabric. You will notice that on some pieces it goes quiet: off to the side, down in a corner, even blending into the fabric.' },
      { quote: 'The cleanest G we can make without it looking ambiguous.' },
      { p: 'It first showed up on the GOODIE®. We had been experimenting with a different G, and when we made the new GOODIE® we made the switch. The reception was mixed at first, but good overall. From there it went to the G-KNIT®, the BABY TEE®, the CARDIE®, all of AMONG THE TREES® and SHIRT® II.' },

      { head: 'For the logo fans' },
      { pair: [{ img: '/assets/study/g-doubbie.png', alt: 'DaJiggler in DOUBBIE® I, two Gen 1 Gs stacked on the chest and stomach.' }, { img: '/assets/study/g-grandpa.png', alt: 'mova_tv in GRANDPA® MAPLE LEAF, the new G set off to one side of the front.' }, { img: '/assets/study/g-wrap.png', alt: 'CoolB33s in WRAP® CINNAMON TOAST, the new G small on the left of the chest.' }],
        caption: 'Loud and quiet. DOUBBIE® I stacks two Gs; GRANDPA® and WRAP® from AMONG THE TREES® keep the new G to the side.' },
      { p: 'Some people love the G, and we love that. The idea of stacking logos came from a conversation on another designer’s Discord. He used to make Roblox items, and he told us some people really loved his asterisk logo; he was thinking about a piece with more than one. That is where the DOUBBIE® came from. The CROPPIE® and DOUBBIE® are for the people who want the logo front and centre, and as many of them as possible.' },

      { head: 'What doesn’t change' },
      { p: 'The design. We will never put something out that we haven’t given the most intimate thought to. We go through a lot of iterations and a lot of changes, and we will always take the utmost consideration before releasing anything.' },
      { p: 'The originals stay, too. SHIRT® I, CROPPIE® I and DOUBBIE® I are some of our most unique pieces, and they keep the heritage of the OG G.' },
      { p: 'If the new G could say one thing, it would be: put me on and let’s go, wherever you’ve got to go. Maybe someone on a server sees your skin, no armour on, and asks where you got it. Maybe someone who has been rocking GOOD® since Gen 1 spots the new G on another server. That would be amazing.', end: true },
    ],
  },
  {
    slug: 'a-study-in-jean',
    rubric: 'STUDY® / INTERVIEW',
    title: 'A STUDY IN JEAN',
    dek: 'A look at creating a timeless piece.',
    byline: 'GOOD® DESIGN',
    date: '2026-09-30',
    description: 'How GOOD® made the JEAN®: SPRINGSTEEN™ Americana, six washes, two layers, and the best jean in Minecraft. An interview.',
    lead: {
      img: '/assets/study/jean-lineup.png',
      alt: 'Seven Minecraft players posing in GOOD® jeans: DaJiggler, Leeeeems, Chinny, BobaYeet, Isabelleblanco, LindseyyHazel and Austin1333.',
      caption: 'Left to right: DaJiggler, Leeeeems, Chinny, BobaYeet, Isabelleblanco, LindseyyHazel and Austin1333, all in the JEAN®.',
    },
    og: '/assets/study/og-a-study-in-jean.png',
    thumb: '/assets/study/jean-lineup.png',
    body: [
      { p: 'The JEAN® is the most involved thing GOOD® has ever made. It took longer than the tee, longer than the GOODIE®, longer than anything on the site, and it is still changing. We sat down to talk about where it came from, why it took so long, and why, on every skin, the jeans always win the top layer.' },
      { note: 'This conversation has been edited and condensed.' },

      { q: 'Why jeans? Why did GOOD® start with denim instead of a tee or a hoodie?' },
      { p: 'We actually didn’t start with jeans. It’s just probably the most involved project we’ve ever created.' },
      { p: 'The tee and the GOODIE® were pretty easy. We wanted a silhouette that’s uniquely ours, with colours that are easy to present and to play with. The GOODIE® went through a lot of silhouette and texture iterations already, and we feel completely good about it now.' },
      { p: 'Jeans took us forever, because we weren’t sure where to start. Look at the common household pair of pants: a person’s jeans are completely unique. You can buy a pair off the rack and it looks completely different the next day.' },
      { quote: 'You can buy a pair off the rack and it looks completely different the next day.' },
      { p: 'Capturing that in a pixel game, creating different shades and different personalities, was something we wanted to take really seriously. For us here, GOOD® colours everything.' },

      { q: 'SPRINGSTEEN™ is the base wash. Why Bruce, and what does “American” mean to GOOD®?' },
      { p: 'It means everything. We always want to create something timeless: not something that’s only relevant in the moment, not something signalling fast fashion, but something that lasts.' },
      { p: 'Springsteen doesn’t necessarily do that. What he does is beckon a time we wish was timeless. Classic Americana, when <em>Summer of ’69</em> was playing, and you had the jeans, the working man’s pair, and it showed you were worldly. You travelled. You did it all in this pair of jeans.' },
      { quote: 'You did it all in this pair of jeans.' },
      { p: 'We always thought jeans told a story, and this is the story we wanted to tell.' },
      { pair: [
          { img: '/assets/study/model-dajiggler.png', alt: 'DaJiggler mid-stride in SHIRT® COTTON/DENIM and the JEAN® in SPRINGSTEEN™.' },
          { img: '/assets/study/model-leeeeems.png', alt: 'Leeeeems in G-KNIT® VANILLA BEAN/GOOD® BLUE and the JEAN® BOOTCUT in PATENT™.' },
        ],
        caption: 'DaJiggler in SHIRT® COTTON/DENIM and the JEAN® in SPRINGSTEEN™. Leeeeems in G-KNIT® VANILLA BEAN/GOOD® BLUE and the JEAN® BOOTCUT in PATENT™.' },

      { q: 'What was the hardest part of making denim read in sixty-four by sixty-four pixels?' },
      { p: 'It’s still something we deal with today, but the rips really added dimension.' },
      { p: 'We lean on something like gestalt theory in 2D design, especially with so few pixels and only two layers: a kind of visual agreement between the player and us that these are jeans. We’ve been doing a great job so far, and we’re always finding ways to level that experience up.' },
      { quote: 'A visual agreement between the player and us: these are jeans.' },

      { q: 'The rips, the shoes, the bootcut flare: which detail took the most tries?' },
      { p: 'The cut. The jeans are agnostic of the wash. We have two jeans right now, three if you count the SAGGING.' },
      { p: 'To give each one a silhouette of its own you have to iterate, constantly: think outside the box and play with the two layers you’re given. It’s funny, because you’d think we’ve done it all, but we keep finding new ways to innovate.' },
      { fig: '/assets/study/jean-cuts.png', alt: 'Eight JEAN® cut studies side by side.', caption: 'Early cut studies: SKINNY®, BOOTCUT®, STACKED®, JORTS®, CARPENTER®, DOUBLE KNEE®, CARGO® and the JEAN® as it stands.' },

      { q: 'You made a rule that the jeans always win the top layer. Where did that come from?' },
      { p: 'They’re the centrepiece of a lot of our looks. Outside of RUNWAY®, the thing we put the most care into is the jean shades, so they’re always going to sit on the outer layer of the skin.' },
      { p: 'We’ve broken that rule a couple of times already. But so far, that’s the main story.' },

      { q: 'Why six washes, and how did you name them? ROADWORN™ and FAVORITE JEANS™ feel personal.' },
      { p: 'Indigo straight off the bolt is where it starts, and you can see every one of them on our <a href="/colors.html">COLORS®</a> page. ROADWORN™ and FAVORITE JEANS™ are about making something that shouldn’t be personal, personal to you.' },
      { p: 'Think of the pair you wore three or four weeks straight. Or the pair that’s been in and out of your closet forever, that you can’t put down. It fits, you know it’s going to rip, and you’re willing to chance it because you love it so much.' },
      { quote: 'You know it’s going to rip, and you’re willing to chance it because you love it so much.' },
      { pair: [
          { img: '/assets/study/model-bobayeet.png', alt: 'BobaYeet waving, one knee up, in a collared shirt and jorts.' },
          { img: '/assets/study/model-isabelleblanco.png', alt: 'Isabelleblanco in CARDIE® STRAWBERRY MILK/TOMATO VINE and the JEAN® BOOTCUT in THE JEAN™.' },
        ],
        caption: 'BobaYeet in COLLAR® COTTON/DENIM and the JORT® in SPRINGSTEEN™ with SNEAK01. Isabelleblanco in CARDIE® STRAWBERRY MILK/TOMATO VINE and the JEAN® BOOTCUT in THE JEAN™.' },

      { q: 'Out of the twenty-wash study and the twelve rip experiments, which ones stuck with you?' },
      { p: 'Honestly, nothing so far. The only things available are the ones that stuck.' },
      { p: 'We want to innovate, but we also want to make something grounded that will last forever, at least as far as we can tell. That’s a very hard middle point, which is why we’re not satisfied with a lot of things.' },
      { fig: '/assets/study/jean-washes.png', alt: 'Twenty jean washes rendered on a Minecraft player, from raw indigo to a GOOD® BLUE overdye.', caption: 'The wash study: twenty washes, from RAW INDIGO to a GOOD® BLUE overdye. None of them made it. Yet.' },
      { fig: '/assets/study/jean-rips.png', alt: 'Twelve experimental jean rips rendered on a Minecraft player.', caption: 'The rip experiments: pocket bags, tartan linings, a jean inside a jean, a G cut from each knee.' },

      { q: 'What does “timeless” mean to you, for clothing and for a Minecraft skin?' },
      { p: 'Something that doesn’t signal <em>we’re only here for a little bit</em>.' },
      { p: 'When we make a silhouette, we want it to be universal: for anyone, in 1990, 2023, 2033 or 2043. Fast fashion comes and goes, and trends come and go, but you can always come back to GOOD® and feel like you’re home again.' },
      { quote: 'You can always come back to GOOD® and feel like you’re home again.' },
      { pair: [
          { img: '/assets/study/model-lindseyyhazel.png', alt: 'LindseyyHazel, hand out, in BABY TEE® SKY/COTTON and the JEAN® BOOTCUT in FAVORITE JEANS™.' },
          { img: '/assets/study/model-chinny.png', alt: 'Chinny in a GOOD® BLUE GOODIE® and sagging jeans.' },
          { img: '/assets/study/model-austin1333.png', alt: 'Austin1333 sitting in a GOOD® BLUE CROPPIE® and dark jeans.' },
        ],
        caption: 'LindseyyHazel in BABY TEE® SKY/COTTON and the JEAN® BOOTCUT in FAVORITE JEANS™. Chinny in GOODIE® GOOD® BLUE/COTTON and the JEAN® SAGGING in THE JEAN™. Austin1333 in CROPPIE® GOOD® BLUE/COTTON and the JEAN® in SELVEDGE™.' },

      { q: 'What’s something about the jeans nobody would notice unless you told them?' },
      { p: 'The back pockets. And the diagonal hem that runs down from the leg to the shoe. People don’t seem to notice it, and it’s on a lot of our jeans. I love that look.' },
      { p: 'In real life it only lasts a little while, until the jeans start to fray. In Minecraft, it lasts forever.' },
      { quote: 'In real life it lasts until the jeans start to fray. In Minecraft, it lasts forever.' },

      { q: 'Where does the JEAN® go next?' },
      { p: 'Exactly where it is, with a lot more shades, and maybe a lot more cuts. But we’ll never lose the heart of what we made here.' },
      { gallery: [
          { img: '/assets/study/stylized-mosaic.png', label: 'MOSAIC®', sub: 'SIDEWALK/CHROME, on the site' },
          { img: '/assets/study/stylized-runway-look-1.png', label: 'LOOK 1®', sub: 'RUNWAY®' },
          { img: '/assets/study/stylized-runway-look-2.png', label: 'LOOK 2®', sub: 'RUNWAY®' },
          { img: '/assets/study/stylized-runway-look-3.png', label: 'LOOK 3®', sub: 'RUNWAY®' },
        ], title: 'The stylized pieces', caption: 'Where the jean goes when we let it: MOSAIC® on DaJiggler, and three RUNWAY® looks on Chinny, BobaYeet and Austin1333.' },

      { q: 'If someone only ever owns one GOOD® piece, why should it be the jeans?' },
      { p: 'It’s free. You should own all of them. But we make the best jean in Minecraft. Period.', end: true },

      { head: 'On the site today' },
      { gallery: [
          { img: '/assets/study/cut-jean.png', label: 'JEAN®', sub: 'Baggy, full outer layer' },
          { img: '/assets/study/cut-jean-bootcut.png', label: 'JEAN® BOOTCUT', sub: 'Kicks out at the hem' },
          { img: '/assets/study/cut-jort.png', label: 'JORT®', sub: 'Cut above the knee, crew socks' },
          { img: '/assets/study/cut-jean-sagging.png', label: 'JEAN® SAGGING', sub: 'Worn low, boxers showing' },
        ], title: 'The cuts' },
      { gallery: [
          { img: '/assets/study/wash-springsteen.png', label: 'SPRINGSTEEN™', sub: 'The base wash' },
          { img: '/assets/study/wash-roadworn.png', label: 'ROADWORN™', sub: '#6285B0' },
          { img: '/assets/study/wash-favorite-jeans.png', label: 'FAVORITE JEANS™', sub: '#86A6C4' },
          { img: '/assets/study/wash-the-jean.png', label: 'THE JEAN™', sub: '#3D5886' },
          { img: '/assets/study/wash-patent.png', label: 'PATENT™', sub: '#283B62' },
          { img: '/assets/study/wash-selvedge.png', label: 'SELVEDGE™', sub: '#161D3A' },
        ], title: 'The washes', caption: 'Every cut comes in every wash. <a href="/">Try them on your skin →</a>' },
    ],
  },
];
if (typeof module !== 'undefined') module.exports = STUDY;
else window.GOOD_STUDY = STUDY;
