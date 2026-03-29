import { createMachine, createActor } from "xstate";

/**
 * UI State Machine for managing complex view transitions.
 * Prevents invalid states like showing details and registration simultaneously.
 */
export const uiMachine = createMachine({
  id: "ui",
  initial: "idle",
  states: {
    idle: {
      on: {
        SELECT_SAMPLE: "details",
        OPEN_REGISTRATION: "registering",
      },
    },
    details: {
      on: {
        CLOSE: "idle",
        EDIT: "editing",
        OPEN_REGISTRATION: "registering",
      },
    },
    editing: {
      on: {
        SAVE: "details",
        CANCEL: "details",
      },
    },
    registering: {
      on: {
        SUBMIT: "idle",
        CANCEL: "idle",
      },
    },
  },
});

export const uiService = createActor(uiMachine).start();
