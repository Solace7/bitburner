import { IPlayer } from "../../IPlayer";
import { Generic_fromJSON, Generic_toJSON, IReviverValue, Reviver } from "../../../utils/JSONReviver";
import { Work, WorkType } from "./Work";
import { ClassType } from "../../../Work/ClassWork";
import { LocationName } from "../../../Locations/data/LocationNames";
import { calculateClassEarnings } from "../../../Work/formulas/Class";
import { Sleeve } from "../Sleeve";
import { applyWorkStats, applyWorkStatsExp, scaleWorkStats, WorkStats } from "../../../Work/WorkStats";

export const isSleeveClassWork = (w: Work | null): w is SleeveClassWork => w !== null && w.type === WorkType.CLASS;

interface ClassWorkParams {
  classType: ClassType;
  location: LocationName;
}

export class SleeveClassWork extends Work {
  classType: ClassType;
  location: LocationName;

  constructor(params?: ClassWorkParams) {
    super(WorkType.CLASS);
    this.classType = params?.classType ?? ClassType.StudyComputerScience;
    this.location = params?.location ?? LocationName.Sector12RothmanUniversity;
  }

  calculateRates(player: IPlayer, sleeve: Sleeve): WorkStats {
    return scaleWorkStats(
      calculateClassEarnings(player, sleeve, this.classType, this.location),
      sleeve.shockBonus(),
      false,
    );
  }

  isGym(): boolean {
    return [ClassType.GymAgility, ClassType.GymDefense, ClassType.GymDexterity, ClassType.GymStrength].includes(
      this.classType,
    );
  }

  process(player: IPlayer, sleeve: Sleeve, cycles: number): number {
    let rate = this.calculateRates(player, sleeve);
    applyWorkStatsExp(sleeve, rate, cycles);
    rate = scaleWorkStats(rate, sleeve.syncBonus(), false);
    applyWorkStats(player, player, rate, cycles, "sleeves");
    player.sleeves.filter((s) => s != sleeve).forEach((s) => applyWorkStatsExp(s, rate, cycles));
    return 0;
  }
  APICopy(): Record<string, unknown> {
    return {
      type: this.type,
      classType: this.classType,
      location: this.location,
    };
  }
  /**
   * Serialize the current object to a JSON save state.
   */
  toJSON(): IReviverValue {
    return Generic_toJSON("SleeveClassWork", this);
  }

  /**
   * Initiatizes a ClassWork object from a JSON save state.
   */
  static fromJSON(value: IReviverValue): SleeveClassWork {
    return Generic_fromJSON(SleeveClassWork, value.data);
  }
}

Reviver.constructors.SleeveClassWork = SleeveClassWork;
