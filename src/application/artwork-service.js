import { ArtworkAssembler } from "./artwork-assembler.js";
import { SourceCatalog } from "./source-catalog.js";

export class ArtworkService {
  constructor({ client, auth, preferences, random = Math.random }) {
    this.preferences = preferences;
    this.catalog = new SourceCatalog({ client, auth, preferences, random });
    this.assembler = new ArtworkAssembler(client);
  }

  async next() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = await this.catalog.nextCandidate();
      const artwork = await this.assembler.assemble(candidate, this.preferences);
      if (artwork) return artwork;
    }
    return null;
  }
}
