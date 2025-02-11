import React, { useState } from "react";
import { Sleeve } from "../Sleeve";
import { IPlayer } from "../../IPlayer";
import { Crimes } from "../../../Crime/Crimes";
import { LocationName } from "../../../Locations/data/LocationNames";
import { CityName } from "../../../Locations/data/CityNames";
import { Factions } from "../../../Faction/Factions";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { FactionNames } from "../../../Faction/data/FactionNames";
import { isSleeveFactionWork } from "../Work/SleeveFactionWork";
import { isSleeveCompanyWork } from "../Work/SleeveCompanyWork";
import { isSleeveBladeburnerWork } from "../Work/SleeveBladeburnerWork";

const universitySelectorOptions: string[] = [
  "Study Computer Science",
  "Data Structures",
  "Networks",
  "Algorithms",
  "Management",
  "Leadership",
];

const gymSelectorOptions: string[] = ["Train Strength", "Train Defense", "Train Dexterity", "Train Agility"];

const bladeburnerSelectorOptions: string[] = [
  "Field analysis",
  "Recruitment",
  "Diplomacy",
  "Infiltrate synthoids",
  "Support main sleeve",
  "Take on contracts",
];

interface IProps {
  sleeve: Sleeve;
  player: IPlayer;
  setABC: (abc: string[]) => void;
}

interface ITaskDetails {
  first: string[];
  second: (s1: string) => string[];
}

function possibleJobs(player: IPlayer, sleeve: Sleeve): string[] {
  // Array of all companies that other sleeves are working at
  const forbiddenCompanies: string[] = [];
  for (const otherSleeve of player.sleeves) {
    if (sleeve === otherSleeve) {
      continue;
    }
    if (isSleeveCompanyWork(otherSleeve.currentWork)) {
      forbiddenCompanies.push(otherSleeve.currentWork.companyName);
    }
  }
  const allJobs: string[] = Object.keys(player.jobs);

  return allJobs.filter((company) => !forbiddenCompanies.includes(company));
}

function possibleFactions(player: IPlayer, sleeve: Sleeve): string[] {
  // Array of all factions that other sleeves are working for
  const forbiddenFactions = [FactionNames.Bladeburners as string, FactionNames.ShadowsOfAnarchy as string];
  if (player.gang) {
    forbiddenFactions.push(player.gang.facName);
  }
  for (const otherSleeve of player.sleeves) {
    if (sleeve === otherSleeve) {
      continue;
    }
    if (isSleeveFactionWork(otherSleeve.currentWork)) {
      forbiddenFactions.push(otherSleeve.currentWork.factionName);
    }
  }

  const factions = [];
  for (const fac of player.factions) {
    if (!forbiddenFactions.includes(fac)) {
      factions.push(fac);
    }
  }

  return factions.filter((faction) => {
    const factionObj = Factions[faction];
    if (!factionObj) return false;
    const facInfo = factionObj.getInfo();
    return facInfo.offerHackingWork || facInfo.offerFieldWork || facInfo.offerSecurityWork;
  });
}

function possibleContracts(player: IPlayer, sleeve: Sleeve): string[] {
  const bb = player.bladeburner;
  if (bb === null) {
    return ["------"];
  }
  let contracts = bb.getContractNamesNetscriptFn();
  for (const otherSleeve of player.sleeves) {
    if (sleeve === otherSleeve) {
      continue;
    }
    if (isSleeveBladeburnerWork(otherSleeve.currentWork) && otherSleeve.currentWork.actionType === "Contracts") {
      const w = otherSleeve.currentWork;
      contracts = contracts.filter((x) => x != w.actionName);
    }
  }
  if (contracts.length === 0) {
    return ["------"];
  }
  return contracts;
}

const tasks: {
  [key: string]: undefined | ((player: IPlayer, sleeve: Sleeve) => ITaskDetails);
  ["------"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Work for Company"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Work for Faction"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Commit Crime"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Take University Course"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Workout at Gym"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Perform Bladeburner Actions"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Shock Recovery"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
  ["Synchronize"]: (player: IPlayer, sleeve: Sleeve) => ITaskDetails;
} = {
  "------": (): ITaskDetails => {
    return { first: ["------"], second: () => ["------"] };
  },
  "Work for Company": (player: IPlayer, sleeve: Sleeve): ITaskDetails => {
    let jobs = possibleJobs(player, sleeve);

    if (jobs.length === 0) jobs = ["------"];
    return { first: jobs, second: () => ["------"] };
  },
  "Work for Faction": (player: IPlayer, sleeve: Sleeve): ITaskDetails => {
    let factions = possibleFactions(player, sleeve);
    if (factions.length === 0) factions = ["------"];

    return {
      first: factions,
      second: (s1: string) => {
        const faction = Factions[s1];
        if (!faction) return ["------"];

        const facInfo = faction.getInfo();
        const options: string[] = [];
        if (facInfo.offerHackingWork) {
          options.push("Hacking Contracts");
        }
        if (facInfo.offerFieldWork) {
          options.push("Field Work");
        }
        if (facInfo.offerSecurityWork) {
          options.push("Security Work");
        }
        return options;
      },
    };
  },
  "Commit Crime": (): ITaskDetails => {
    return { first: Object.values(Crimes).map((crime) => crime.name), second: () => ["------"] };
  },
  "Take University Course": (player: IPlayer, sleeve: Sleeve): ITaskDetails => {
    let universities: string[] = [];
    switch (sleeve.city) {
      case CityName.Aevum:
        universities = [LocationName.AevumSummitUniversity];
        break;
      case CityName.Sector12:
        universities = [LocationName.Sector12RothmanUniversity];
        break;
      case CityName.Volhaven:
        universities = [LocationName.VolhavenZBInstituteOfTechnology];
        break;
      default:
        universities = ["No university available in city!"];
        break;
    }

    return { first: universitySelectorOptions, second: () => universities };
  },
  "Workout at Gym": (player: IPlayer, sleeve: Sleeve): ITaskDetails => {
    let gyms: string[] = [];
    switch (sleeve.city) {
      case CityName.Aevum:
        gyms = [LocationName.AevumCrushFitnessGym, LocationName.AevumSnapFitnessGym];
        break;
      case CityName.Sector12:
        gyms = [LocationName.Sector12IronGym, LocationName.Sector12PowerhouseGym];
        break;
      case CityName.Volhaven:
        gyms = [LocationName.VolhavenMilleniumFitnessGym];
        break;
      default:
        gyms = ["No gym available in city!"];
        break;
    }

    return { first: gymSelectorOptions, second: () => gyms };
  },
  "Perform Bladeburner Actions": (player: IPlayer, sleeve: Sleeve): ITaskDetails => {
    return {
      first: bladeburnerSelectorOptions,
      second: (s1: string) => {
        if (s1 === "Take on contracts") {
          return possibleContracts(player, sleeve);
        } else {
          return ["------"];
        }
      },
    };
  },
  "Shock Recovery": (): ITaskDetails => {
    return { first: ["------"], second: () => ["------"] };
  },
  Synchronize: (): ITaskDetails => {
    return { first: ["------"], second: () => ["------"] };
  },
};

const canDo: {
  [key: string]: undefined | ((player: IPlayer, sleeve: Sleeve) => boolean);
  ["------"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Work for Company"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Work for Faction"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Commit Crime"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Take University Course"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Workout at Gym"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Perform Bladeburner Actions"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Shock Recovery"]: (player: IPlayer, sleeve: Sleeve) => boolean;
  ["Synchronize"]: (player: IPlayer, sleeve: Sleeve) => boolean;
} = {
  "------": () => true,
  "Work for Company": (player: IPlayer, sleeve: Sleeve) => possibleJobs(player, sleeve).length > 0,
  "Work for Faction": (player: IPlayer, sleeve: Sleeve) => possibleFactions(player, sleeve).length > 0,
  "Commit Crime": () => true,
  "Take University Course": (player: IPlayer, sleeve: Sleeve) =>
    [CityName.Aevum, CityName.Sector12, CityName.Volhaven].includes(sleeve.city),
  "Workout at Gym": (player: IPlayer, sleeve: Sleeve) =>
    [CityName.Aevum, CityName.Sector12, CityName.Volhaven].includes(sleeve.city),
  "Perform Bladeburner Actions": (player: IPlayer) => player.inBladeburner(),
  "Shock Recovery": (player: IPlayer, sleeve: Sleeve) => sleeve.shock < 100,
  Synchronize: (player: IPlayer, sleeve: Sleeve) => sleeve.sync < 100,
};

function getABC(sleeve: Sleeve): [string, string, string] {
  return ["------", "------", "------"];

  // switch (sleeve.currentTask) {
  //   case SleeveTaskType.Idle:
  //   case SleeveTaskType.Company:
  //   case SleeveTaskType.Faction: {
  //   }
  //   case SleeveTaskType.Crime:
  //     return ["Commit Crime", sleeve.crimeType, "------"];
  //   case SleeveTaskType.Class:
  //   case SleeveTaskType.Gym: {
  //     switch (sleeve.gymStatType) {
  //       case "none":
  //         return ["Idle", "------", "------"];
  //       case "str":
  //         return ["Workout at Gym", "Train Strength", sleeve.currentTaskLocation];
  //       case "def":
  //         return ["Workout at Gym", "Train Defense", sleeve.currentTaskLocation];
  //       case "dex":
  //         return ["Workout at Gym", "Train Dexterity", sleeve.currentTaskLocation];
  //       case "agi":
  //         return ["Workout at Gym", "Train Agility", sleeve.currentTaskLocation];
  //     }
  //   }
  //   case SleeveTaskType.Bladeburner:
  //     return ["Perform Bladeburner Actions", sleeve.bbAction, sleeve.bbContract];
  //   case SleeveTaskType.Recovery:
  //     return ["Shock Recovery", "------", "------"];
  //   case SleeveTaskType.Synchro:
  //     return ["Synchronize", "------", "------"];
  // }
}

export function TaskSelector(props: IProps): React.ReactElement {
  const abc = getABC(props.sleeve);
  const [s0, setS0] = useState(abc[0]);
  const [s1, setS1] = useState(abc[1]);
  const [s2, setS2] = useState(abc[2]);

  const validActions = Object.keys(canDo).filter((k) =>
    (canDo[k] as (player: IPlayer, sleeve: Sleeve) => boolean)(props.player, props.sleeve),
  );

  const detailsF = tasks[s0];
  if (detailsF === undefined) throw new Error(`No function for task '${s0}'`);
  const details = detailsF(props.player, props.sleeve);
  const details2 = details.second(s1);

  if (details.first.length > 0 && !details.first.includes(s1)) {
    setS1(details.first[0]);
    props.setABC([s0, details.first[0], s2]);
  }
  if (details2.length > 0 && !details2.includes(s2)) {
    setS2(details2[0]);
    props.setABC([s0, s1, details2[0]]);
  }

  function onS0Change(event: SelectChangeEvent<string>): void {
    const n = event.target.value;
    const detailsF = tasks[n];
    if (detailsF === undefined) throw new Error(`No function for task '${s0}'`);
    const details = detailsF(props.player, props.sleeve);
    const details2 = details.second(details.first[0]) ?? ["------"];
    setS2(details2[0]);
    setS1(details.first[0]);
    setS0(n);
    props.setABC([n, details.first[0], details2[0]]);
  }

  function onS1Change(event: SelectChangeEvent<string>): void {
    setS1(event.target.value);
    props.setABC([s0, event.target.value, s2]);
  }

  function onS2Change(event: SelectChangeEvent<string>): void {
    setS2(event.target.value);
    props.setABC([s0, s1, event.target.value]);
  }

  return (
    <>
      <Select onChange={onS0Change} value={s0} sx={{ width: "100%" }}>
        {validActions.map((task) => (
          <MenuItem key={task} value={task}>
            {task}
          </MenuItem>
        ))}
      </Select>
      {!(details.first.length === 1 && details.first[0] === "------") && (
        <>
          <Select onChange={onS1Change} value={s1} sx={{ width: "100%" }}>
            {details.first.map((detail) => (
              <MenuItem key={detail} value={detail}>
                {detail}
              </MenuItem>
            ))}
          </Select>
        </>
      )}
      {!(details2.length === 1 && details2[0] === "------") && (
        <>
          <Select onChange={onS2Change} value={s2} sx={{ width: "100%" }}>
            {details2.map((detail) => (
              <MenuItem key={detail} value={detail}>
                {detail}
              </MenuItem>
            ))}
          </Select>
        </>
      )}
    </>
  );
}
