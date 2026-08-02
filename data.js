// Borrowed Light — constellation data
// Gerwig sits at the center. Category "hub" nodes (Film, Literature,
// Music) sit one ring out, and each person connects to their hub
// rather than straight to Gerwig — a two-level constellation instead
// of a flat one. Positions aren't stored here; sketch.js lays the
// whole thing out procedurally from these relationships.

const nodes = [

  {
    id: 0,
    name: "Greta Gerwig",
    type: "director",
    category: "Director",
    color: "#ff5ca8",
    size: 34,
    icon: "director",
    photo: "images/greta-gerwig.png",
    note: "Selecting Gerwig reveals the filmmakers, writers, and works that shaped her work."
  },

  // ---- category hubs ----

  {
    id: 1,
    name: "Film",
    type: "hub",
    category: "Film",
    color: "#ffd45f",
    size: 26,
    icon: "film",
    note: "The directors whose work most directly shaped hers."
  },

  {
    id: 2,
    name: "Literature",
    type: "hub",
    category: "Literature",
    color: "#77f7da",
    size: 26,
    icon: "book",
    note: "The writers behind the words she keeps returning to."
  },

  {
    id: 3,
    name: "Music",
    type: "hub",
    category: "Music",
    color: "#8bdcff",
    size: 26,
    icon: "music",
    note: "Where movie musicals and choreography feed her sense of world-building."
  },

  // ---- people, each attached to a hub via hubId ----

  {
    id: 4,
    name: "Agnès Varda",
    type: "influence",
    category: "Film",
    hubId: 1,
    color: "#ffd45f",
    size: 16,
    icon: "film",
    photo: "images/agnes-varda.png",
    note: "Playful, humanist lens on everyday life informs Gerwig's storytelling and perspective."
  },

  {
    id: 5,
    name: "Éric Rohmer",
    type: "influence",
    category: "Film",
    hubId: 1,
    color: "#ffd45f",
    size: 16,
    icon: "film",
    photo: "images/eric-rohmer.png",
    note: "Moments of silence, uncertainty, and pause in his dialogue-driven films echo in Gerwig's work."
  },

  {
    id: 6,
    name: "Jacques Demy",
    type: "influence",
    category: "Film",
    hubId: 1,
    color: "#ffd45f",
    size: 16,
    icon: "film",
    photo: "images/jacques-demy.png",
    note: "Color, emotion, and escapism of his Technicolor musicals shaped her world-building sensibility."
  },

  {
    id: 7,
    name: "Michael Cimino",
    type: "influence",
    category: "Film",
    hubId: 1,
    color: "#ffd45f",
    size: 16,
    icon: "film",
    photo: "images/michael-cimino.png",
    note: "Heaven's Gate cited as an influence on the epic-western scope of Little Women."
  },

  {
    id: 8,
    name: "Martin Scorsese",
    type: "influence",
    category: "Film",
    hubId: 1,
    color: "#ffd45f",
    size: 16,
    icon: "film",
    photo: "images/martin-scorsese.png",
    note: "The Age of Innocence cited as a literary-adaptation touchstone for Little Women."
  },

  {
    id: 9,
    name: "Joan Didion",
    type: "influence",
    category: "Literature",
    hubId: 2,
    color: "#77f7da",
    size: 16,
    icon: "book",
    photo: "images/joan-didion.png",
    note: "Sharp observations on identity and self-invention echo throughout Gerwig's characters."
  },

  {
    id: 10,
    name: "Louisa May Alcott",
    type: "influence",
    category: "Literature",
    hubId: 2,
    color: "#77f7da",
    size: 16,
    icon: "book",
    photo: "images/louisa-may-alcott.png",
    note: "Source author of Little Women; Gerwig called her \u201Cthe heroine of my adulthood.\u201D"
  },

  {
    id: 11,
    name: "Vincente Minnelli",
    type: "influence",
    category: "Music",
    hubId: 3,
    color: "#8bdcff",
    size: 16,
    icon: "music",
    photo: "images/vincente-minnelli.png",
    note: "\u201CMovie musicals were the first thing I ever loved\u201D \u2014 her lead influence on Little Women."
  }

];

// edges are derived from the relationships above: every hub connects
// back to the director, and every person connects to their hub
const edges = [];
for (const n of nodes) {
  if (n.type === "hub") edges.push([0, n.id]);
  if (n.hubId !== undefined) edges.push([n.hubId, n.id]);
}
