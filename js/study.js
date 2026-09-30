// STUDY®: GOOD®'s journal. One entry per post, newest first.
// After editing, run `node tools/build-study.js`: it writes study.html (the
// archive) and study/<slug>.html (each post) as static pages, so search
// engines and link previews see the full text, images and metadata.
// Post bodies are written here by us, so their HTML is trusted; comments never
// are (see api/comments.js and js/study-comments.js).
//
// Blocks in body:
//   { p }                    a paragraph (HTML); the first one gets the drop cap
//   { q }                    an interview question
//   { quote }                a pull quote
//   { fig, alt, caption }    a full-width figure
//   { pair: [{ img, alt }], caption }   two or three images side by side
//   { gallery: [{ img, label, sub }], title, caption }   a labelled grid
//   { head }                 a section heading
//   { end: true }            the end mark after the last paragraph
const STUDY = [
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
          { img: '/assets/study/model-dajiggler.png', alt: 'DaJiggler mid-stride in a white tee and light jeans.' },
          { img: '/assets/study/model-leeeeems.png', alt: 'Leeeeems in a G-KNIT® sweater and dark bootcut jeans.' },
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
          { img: '/assets/study/model-isabelleblanco.png', alt: 'Isabelleblanco looking back over a shoulder in a pink hood and mid-wash jeans.' },
        ],
        caption: 'BobaYeet in COLLAR® COTTON/DENIM and the JORT® in SPRINGSTEEN™ with SNEAK01. Isabelleblanco in DOUBBIE® DUST PINK/TOMATO VINE and the JEAN® in ROADWORN™.' },

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
          { img: '/assets/study/model-lindseyyhazel.png', alt: 'LindseyyHazel, hand out, in a sky-blue baby tee and light bootcut jeans.' },
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
