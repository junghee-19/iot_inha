import { BUILDING_NAMES } from './constants';

export type BuildingName = typeof BUILDING_NAMES[number];

export interface Room {
  name: string;
}

// Represents a row in the room directory table
export interface DirectoryRow {
  level: string;
  columns: Room[][]; 
}

// Represents labels next to the floor plan image
export interface FloorPlanLabel {
    level: string;
    image: string;
}

export interface Building {
  id: number;
  name: BuildingName;
  image: string;
  floorPlanLabels: FloorPlanLabel[];
  directory: DirectoryRow[];
}