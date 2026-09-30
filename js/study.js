// STUDY®: GOOD®'s journal. One entry per post, newest first; shown on study.html
// (the list, and each post at study.html?p=<slug>). Post bodies are written
// here by us, so their HTML is trusted; comments never are (see api/comments.js).
// body: { q, a } = an interview question and answer (a may contain links),
//       { img, alt, caption } = a figure.
window.GOOD_STUDY = [
  {
    slug: 'a-study-in-jean',
    title: 'A STUDY IN JEAN',
    subtitle: 'A look at creating a timeless piece',
    date: '2026-09-30',
    cover: 'assets/study/jean-cuts.png',
    coverAlt: 'Eight JEAN® cuts rendered on a Minecraft player: skinny, bootcut, stacked, jorts, carpenter, double knee, cargo and the current JEAN®.',
    coverCaption: 'Cut studies: SKINNY®, BOOTCUT®, STACKED®, JORTS®, CARPENTER®, DOUBLE KNEE®, CARGO® and the JEAN® as it is today.',
    intro: 'The JEAN® is the most involved thing GOOD® has ever made. We sat down to talk about where it came from, why it took so long, and why the jeans always win the top layer.',
    body: [
      { q: 'Why jeans? Why did GOOD® start with denim instead of a tee or a hoodie?',
        a: '<p>We actually didn’t start with jeans. It’s just probably the most involved project we’ve ever created. The tee and the GOODIE® were pretty easy: we wanted a silhouette that’s uniquely ours, with colours that are easy to present and to play with. The GOODIE® went through a lot of silhouette and texture iterations already, and we feel completely good about it now.</p><p>Jeans took us forever, because we weren’t sure where to start. Look at the common household pair of pants: a person’s jeans are completely unique. You can buy a pair off the rack and it looks completely different the next day. Capturing that in a pixel game, creating different shades and different personalities, was something we wanted to take really seriously. For us here, GOOD® colours everything.</p>' },
      { q: 'SPRINGSTEEN™ is the base wash. Why Bruce, and what does “American” mean to GOOD®?',
        a: '<p>It means everything. We always want to create something timeless: not something that’s only relevant in the moment, not something signalling fast fashion, but something that lasts.</p><p>Springsteen doesn’t necessarily do that, but he beckons a time we wish was timeless. Classic Americana, when <em>Summer of ’69</em> was playing, and you had the jeans, the working man’s pair, and it showed you were worldly. You travelled. You did it all in this pair of jeans. We always thought jeans told a story, and this is the story we wanted to tell.</p>' },
      { q: 'What was the hardest part of making denim read in 64×64 pixels?',
        a: '<p>It’s still something we deal with today, but the rips really added dimension. We lean on something like gestalt theory in 2D design, especially with so few pixels and only two layers: a visual agreement between the player and us that <em>these are jeans</em>. We think we’ve been doing a great job so far, and we’re always finding ways to level that experience up.</p>' },
      { q: 'The rips, the shoes, the bootcut flare: which detail took the most tries?',
        a: '<p>The cut. The jeans are agnostic of the wash. We have two jeans right now, three if you count the SAGGING. To give each one a silhouette of its own you have to iterate, constantly: think outside the box and play with the two layers you’re given. It’s funny, because you’d think we’ve done it all, but we keep finding new ways to innovate.</p>' },
      { q: 'You made a rule that the jeans always win the top layer. Where did that come from?',
        a: '<p>They’re the centrepiece of a lot of our looks. Outside of RUNWAY®, the thing we put the most care into is the jean shades, so they’re always going to sit on the outer layer of the skin. We’ve broken that rule a couple of times already, but so far that’s the main story.</p>' },
      { q: 'Why six washes, and how did you name them? ROADWORN™ and FAVORITE JEANS™ feel personal.',
        a: '<p>Indigo straight off the bolt is where it starts, and you can see every one of them on our <a href="colors.html">COLORS®</a> page. ROADWORN™ and FAVORITE JEANS™ are about making something that shouldn’t be personal, personal to you.</p><p>Think of the pair you wore three or four weeks straight. Or the pair that’s been in and out of your closet forever, that you can’t put down: it fits, you know it’s going to rip, and you’re willing to chance it because you love it so much.</p>' },
      { img: 'assets/study/jean-washes.png', alt: 'Twenty jean washes rendered on a Minecraft player, from raw indigo to a GOOD® BLUE overdye.', caption: 'The wash study: twenty washes, from RAW INDIGO to a GOOD® BLUE overdye.' },
      { img: 'assets/study/jean-rips.png', alt: 'Twelve experimental jean rips rendered on a Minecraft player.', caption: 'The rip experiments: pocket bags, tartan linings, a jean inside a jean, a G cut from each knee.' },
      { q: 'Out of the 20-wash study and the 12 rip experiments, which ones stuck with you?',
        a: '<p>Honestly, nothing so far. The only things available are the ones that stuck. We want to innovate, but we also want to make something grounded that lasts forever, at least as far as we can tell. That’s a very hard middle point, which is why we’re not satisfied with a lot of things.</p>' },
      { q: 'What does “timeless” mean to you, for clothing and for a Minecraft skin?',
        a: '<p>Something that doesn’t signal <em>we’re only here for a little bit</em>. When we make a silhouette we want it to be universal: for anyone, in 1990, 2023, 2033 or 2043. Fast fashion comes and goes and trends come and go, but you can always come back to GOOD® and feel like you’re home again.</p>' },
      { q: 'What’s something about the jeans nobody would notice unless you told them?',
        a: '<p>The back pockets. And the diagonal hem that runs down from the leg to the shoe. People don’t seem to notice it, and it’s on a lot of our jeans. I love that look. In real life it only lasts a little while before the jeans start to fray. In Minecraft, it lasts forever.</p>' },
      { q: 'Where does the JEAN® go next?',
        a: '<p>Exactly where it is, with a lot more shades, and maybe a lot more cuts. But we’ll never lose the heart of what we made here.</p>' },
      { q: 'If someone only ever owns one GOOD® piece, why should it be the jeans?',
        a: '<p>It’s free. You should own all of them. But we make the best jean in Minecraft. Period.</p>' },
    ],
  },
];
