export interface PortConfig {
  name: string;
}

export interface ReplacementConfig {
  filename: string;
  match: string;
  replaceWith: string;
}

export interface UniquePortAssignmentConfig {
  ports: PortConfig[];
  replacements: ReplacementConfig[];
}

export interface WorktreeSetupStep {
  shell?: string;
  copyFiles?: string[];
}

export interface ProjectConfig {
  localStateDbFilename?: string;
  worktreeRootDir?: string;
  uniquePortAssignment?: UniquePortAssignmentConfig;
  worktreeSetupSteps?: WorktreeSetupStep[];
}