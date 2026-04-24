async function tryNativeJsonSave(filename, data) {
  if (
    !window.__irefinedElectron ||
    typeof window.__irefinedElectron.saveJson !== "function"
  ) {
    return null;
  }

  try {
    const result = await window.__irefinedElectron.saveJson({
      filename,
      data,
    });

    if (result?.canceled) {
      return {
        saved: false,
        canceled: true,
        native: true,
        filePath: "",
      };
    }

    return {
      saved: true,
      canceled: false,
      native: true,
      filePath: result?.filePath || "",
    };
  } catch (error) {
    console.warn("[iRefinedX] Native JSON save failed", error);
    return null;
  }
}

async function tryNativeJsonFolderSave(files) {
  if (
    !window.__irefinedElectron ||
    typeof window.__irefinedElectron.saveJsonFolder !== "function"
  ) {
    return null;
  }

  try {
    const result = await window.__irefinedElectron.saveJsonFolder({
      files,
    });

    if (result?.canceled) {
      return {
        saved: false,
        canceled: true,
        native: true,
        filePath: "",
      };
    }

    return {
      saved: true,
      canceled: false,
      native: true,
      filePath: result?.filePath || "",
    };
  } catch (error) {
    console.warn("[iRefinedX] Native JSON folder save failed", error);
    return null;
  }
}

async function tryBrowserFilePickerSave(filename, data) {
  if (typeof window.showSaveFilePicker !== "function") {
    return null;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      excludeAcceptAllOption: false,
      types: [
        {
          description: "JSON Files",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
    });
    const writable = await handle.createWritable();

    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();

    return {
      saved: true,
      canceled: false,
      native: true,
      filePath: handle.name || filename,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        saved: false,
        canceled: true,
        native: true,
        filePath: "",
      };
    }

    console.warn("[iRefinedX] Browser file picker save failed", error);
    return null;
  }
}

async function tryBrowserDirectorySave(files) {
  if (typeof window.showDirectoryPicker !== "function") {
    return null;
  }

  try {
    const directoryHandle = await window.showDirectoryPicker({
      mode: "readwrite",
    });

    for (const file of files) {
      if (!file?.filename) {
        continue;
      }

      const fileHandle = await directoryHandle.getFileHandle(file.filename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();

      await writable.write(JSON.stringify(file.data, null, 2));
      await writable.close();
    }

    return {
      saved: true,
      canceled: false,
      native: true,
      filePath: directoryHandle.name || "",
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      return {
        saved: false,
        canceled: true,
        native: true,
        filePath: "",
      };
    }

    console.warn("[iRefinedX] Browser directory save failed", error);
    return null;
  }
}

export async function downloadJson(filename, data) {
  const nativeResult = await tryNativeJsonSave(filename, data);

  if (nativeResult) {
    return nativeResult;
  }

  const pickerResult = await tryBrowserFilePickerSave(filename, data);

  if (pickerResult) {
    return pickerResult;
  }

  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    })
  );
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();

  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 1000);

  return {
    saved: true,
    canceled: false,
    native: false,
    filePath: "",
  };
}

export async function downloadJsonFolder(directoryName, files) {
  const normalizedFiles = (Array.isArray(files) ? files : []).filter(
    (file) => file && typeof file.filename === "string" && file.filename
  );

  if (normalizedFiles.length < 1) {
    return {
      saved: false,
      canceled: false,
      native: false,
      filePath: "",
    };
  }

  const nativeResult = await tryNativeJsonFolderSave(normalizedFiles);

  if (nativeResult) {
    return nativeResult;
  }

  const pickerResult = await tryBrowserDirectorySave(normalizedFiles);

  if (pickerResult) {
    return pickerResult;
  }

  for (const file of normalizedFiles) {
    await downloadJson(file.filename, file.data);
  }

  return {
    saved: true,
    canceled: false,
    native: false,
    filePath: "",
  };
}
