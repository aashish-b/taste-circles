import type { NormalizedSearchResult } from "@/server/providers/types";

export const providerFixtures: NormalizedSearchResult[] = [
  // TV
  { category: "TV", provider: "TMDB", providerId: "1396", title: "Breaking Bad", year: 2008, creators: ["Vince Gilligan"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "1668", title: "Friends", year: 1994, creators: ["David Crane", "Marta Kauffman"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "1418", title: "The Big Bang Theory", year: 2007, creators: ["Chuck Lorre", "Bill Prady"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "1399", title: "Game of Thrones", year: 2011, creators: ["David Benioff", "D. B. Weiss"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "66732", title: "Stranger Things", year: 2016, creators: ["The Duffer Brothers"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "94605", title: "Arcane", year: 2021, creators: ["Christian Linke", "Alex Yee"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "60735", title: "The Flash", year: 2014, creators: ["Greg Berlanti"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "82856", title: "The Mandalorian", year: 2019, creators: ["Jon Favreau"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "85552", title: "Euphoria", year: 2019, creators: ["Sam Levinson"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "60059", title: "Better Call Saul", year: 2015, creators: ["Vince Gilligan", "Peter Gould"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "2316", title: "The Office", year: 2005, creators: ["Greg Daniels"], thumbUrl: null },
  { category: "TV", provider: "TMDB", providerId: "136315", title: "The Bear", year: 2022, creators: ["Christopher Storer"], thumbUrl: null },

  // MOVIES
  { category: "MOVIE", provider: "TMDB", providerId: "157336", title: "Interstellar", year: 2014, creators: ["Christopher Nolan"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "27205", title: "Inception", year: 2010, creators: ["Christopher Nolan"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "155", title: "The Dark Knight", year: 2008, creators: ["Christopher Nolan"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "13", title: "Forrest Gump", year: 1994, creators: ["Robert Zemeckis"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "278", title: "The Shawshank Redemption", year: 1994, creators: ["Frank Darabont"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "238", title: "The Godfather", year: 1972, creators: ["Francis Ford Coppola"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "680", title: "Pulp Fiction", year: 1994, creators: ["Quentin Tarantino"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "329865", title: "Arrival", year: 2016, creators: ["Denis Villeneuve"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "64690", title: "Drive", year: 2011, creators: ["Nicolas Winding Refn"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "550", title: "Fight Club", year: 1999, creators: ["David Fincher"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "11", title: "Star Wars", year: 1977, creators: ["George Lucas"], thumbUrl: null },
  { category: "MOVIE", provider: "TMDB", providerId: "496243", title: "Parasite", year: 2019, creators: ["Bong Joon-ho"], thumbUrl: null },

  // MUSIC
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "nfr-2019", title: "Norman Fucking Rockwell!", year: 2019, creators: ["Lana Del Rey"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "abbey-road", title: "Abbey Road", year: 1969, creators: ["The Beatles"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "thriller", title: "Thriller", year: 1982, creators: ["Michael Jackson"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "blond", title: "Blonde", year: 2016, creators: ["Frank Ocean"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "ok-computer", title: "OK Computer", year: 1997, creators: ["Radiohead"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "tpab", title: "To Pimp a Butterfly", year: 2015, creators: ["Kendrick Lamar"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "currents", title: "Currents", year: 2015, creators: ["Tame Impala"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "rumours", title: "Rumours", year: 1977, creators: ["Fleetwood Mac"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "channel-orange", title: "Channel Orange", year: 2012, creators: ["Frank Ocean"], thumbUrl: null },
  { category: "MUSIC", provider: "MUSICBRAINZ", providerId: "1989-taylor", title: "1989", year: 2014, creators: ["Taylor Swift"], thumbUrl: null },

  // ANIME
  { category: "ANIME", provider: "ANILIST", providerId: "19", title: "Monster", year: 2004, creators: ["Naoki Urasawa"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "16498", title: "Attack on Titan", year: 2013, creators: ["Hajime Isayama"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "1535", title: "Death Note", year: 2006, creators: ["Tsugumi Ohba"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "20", title: "Naruto", year: 2002, creators: ["Masashi Kishimoto"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "21", title: "One Piece", year: 1999, creators: ["Eiichiro Oda"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "1", title: "Cowboy Bebop", year: 1998, creators: ["Shinichiro Watanabe"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "5114", title: "Fullmetal Alchemist: Brotherhood", year: 2009, creators: ["Hiromu Arakawa"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "11061", title: "Hunter x Hunter", year: 2011, creators: ["Yoshihiro Togashi"], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "9253", title: "Steins;Gate", year: 2011, creators: ["5pb."], thumbUrl: null },
  { category: "ANIME", provider: "ANILIST", providerId: "20583", title: "Haikyuu!!", year: 2014, creators: ["Haruichi Furudate"], thumbUrl: null },

  // BOOKS
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL82563W", title: "A Wizard of Earthsea", year: 1968, creators: ["Ursula K. Le Guin"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL27448W", title: "1984", year: 1949, creators: ["George Orwell"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL262758W", title: "The Hobbit", year: 1937, creators: ["J. R. R. Tolkien"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL7343620W", title: "Harry Potter and the Sorcerer's Stone", year: 1997, creators: ["J. K. Rowling"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL45804W", title: "Dune", year: 1965, creators: ["Frank Herbert"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL45883W", title: "The Catcher in the Rye", year: 1951, creators: ["J. D. Salinger"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL45805W", title: "To Kill a Mockingbird", year: 1960, creators: ["Harper Lee"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL15238421W", title: "The Name of the Wind", year: 2007, creators: ["Patrick Rothfuss"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL15626917W", title: "The Way of Kings", year: 2010, creators: ["Brandon Sanderson"], thumbUrl: null },
  { category: "BOOK", provider: "OPEN_LIBRARY", providerId: "OL45879W", title: "Pride and Prejudice", year: 1813, creators: ["Jane Austen"], thumbUrl: null },

  // GAMES
  { category: "GAME", provider: "RAWG", providerId: "4200", title: "Outer Wilds", year: 2019, creators: ["Mobius Digital"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "3328", title: "The Witcher 3: Wild Hunt", year: 2015, creators: ["CD PROJEKT RED"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "3498", title: "Grand Theft Auto V", year: 2013, creators: ["Rockstar North"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "5679", title: "The Elder Scrolls V: Skyrim", year: 2011, creators: ["Bethesda Game Studios"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "4291", title: "Counter-Strike 2", year: 2023, creators: ["Valve"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "4292", title: "Dark Souls", year: 2011, creators: ["FromSoftware"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "13536", title: "Portal 2", year: 2011, creators: ["Valve"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "802", title: "Borderlands 2", year: 2012, creators: ["Gearbox Software"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "3070", title: "Fallout 4", year: 2015, creators: ["Bethesda Game Studios"], thumbUrl: null },
  { category: "GAME", provider: "RAWG", providerId: "3939", title: "Cyberpunk 2077", year: 2020, creators: ["CD PROJEKT RED"], thumbUrl: null },
];
