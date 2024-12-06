import { Model } from "@ironcalc/wasm";
import { base64ToBytes, bytesToBase64 } from "./util";

const MAX_WORKBOOKS = 50;

type ModelsMetadata = Record<string, string>;

export function updateNameSelectedWorkbook(model: Model, newName: string) {
  const uuid = localStorage.getItem("selected");
  if (uuid) {
    const modelsJson = localStorage.getItem("models");
    if (modelsJson) {
      try {
        const models = JSON.parse(modelsJson);
        models[uuid] = newName;
        localStorage.setItem("models", JSON.stringify(models));
      } catch (e) {
        console.warn("Failed saving new name");
      }
    }
    const modeBytes = model.toBytes();
    localStorage.setItem(uuid, bytesToBase64(modeBytes));
  }
}

export function getModelsMetadata(): ModelsMetadata {
  let modelsJson = localStorage.getItem("models");
  if (!modelsJson) {
    modelsJson = "{}";
  }
  return JSON.parse(modelsJson);
}

// Pick a different name Workbook{N} where N = 1, 2, 3
function getNewName(existingNames: string[]): string {
  const baseName = "Workbook";
  let index = 1;
  while (index < MAX_WORKBOOKS) {
    const name = `${baseName}${index}`;
    index += 1;
    if (!existingNames.includes(name)) {
      return name;
    }
  }
  // FIXME: Too many workbooks?
  return "Workbook-Infinity";
}

export function createNewModel(): Model {
  const models = getModelsMetadata();
  const name = getNewName(Object.values(models));

  const model = new Model(name, "en", "UTC");
  const uuid = crypto.randomUUID();
  localStorage.setItem("selected", uuid);
  localStorage.setItem(uuid, bytesToBase64(model.toBytes()));

  models[uuid] = name;
  localStorage.setItem("models", JSON.stringify(models));
  return model;
}

export function loadModelFromStorageOrCreate(): Model {
  const uuid = localStorage.getItem("selected");
  if (uuid) {
    // We try to load the selected model
    const modelBytesString = localStorage.getItem(uuid);
    if (modelBytesString) {
      return Model.from_bytes(base64ToBytes(modelBytesString));
    }
    // If it doesn't exist we create one at that uuid
    const newModel = new Model("Workbook1", "en", "UTC");
    localStorage.setItem("selected", uuid);
    localStorage.setItem(uuid, bytesToBase64(newModel.toBytes()));
    return newModel;
  }
  // If there was no selected model we create a new one
  return createNewModel();
}

export function saveSelectedModelInStorage(model: Model) {
  const uuid = localStorage.getItem("selected");
  if (uuid) {
    const modeBytes = model.toBytes();
    localStorage.setItem(uuid, bytesToBase64(modeBytes));
  }
}

export function saveModelToStorage(model: Model) {
  const uuid = crypto.randomUUID();
  localStorage.setItem("selected", uuid);
  localStorage.setItem(uuid, bytesToBase64(model.toBytes()));
  let modelsJson = localStorage.getItem("models");
  if (!modelsJson) {
    modelsJson = "{}";
  }
  const models = JSON.parse(modelsJson);
  models[uuid] = model.getName();
  localStorage.setItem("models", JSON.stringify(models));
}

export function selectModelFromStorage(uuid: string): Model | null {
  localStorage.setItem("selected", uuid);
  const modelBytesString = localStorage.getItem(uuid);
  if (modelBytesString) {
    return Model.from_bytes(base64ToBytes(modelBytesString));
  }
  return null;
}

export function getSelectedUuid(): string | null {
  return localStorage.getItem("selected");
}

export function deleteSelectedModel(): Model | null {
  const uuid = localStorage.getItem("selected");
  if (!uuid) {
    return null;
  }
  localStorage.removeItem(uuid);
  const metadata = getModelsMetadata();
  delete metadata[uuid];
  localStorage.setItem("models", JSON.stringify(metadata));
  const uuids = Object.keys(metadata);
  if (uuids.length === 0) {
    return createNewModel();
  }
  return selectModelFromStorage(uuids[0]);
}
