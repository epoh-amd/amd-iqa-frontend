import React, { useState, useEffect } from "react";
import "../../assets/css/waiver.css";
import api from "../../services/api";
import { useAuth } from '../../contexts/AuthContext.js';

const generateWaiverId = () => {
  const year = new Date().getFullYear().toString().slice(-2); // 2026 -> 26

  const runningNumber = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0"); // 001, 002...

  const amendment = "A";

  return `WV${year}${runningNumber}-${amendment}`;
};



const WaiverForm = () => {
  const { user } = useAuth();
  const userId = user?.employee_number;
  useEffect(() => {
    if (!userId) return;

    const loadDraft = async () => {
      try {
        const data = await api.getDraftDetails(userId);

        if (data?.formData?.waiverId) {
          // ✅ use saved ID
          setWaiverId(data.formData.waiverId);
        } else {
          // ✅ generate ONLY once
          setWaiverId(generateWaiverId());
        }


        setFormData(data.formData ?? {
          partNumber: "",
          revision: "",
          description: "",
          subcontractor: "",
          assemblyLevel: "",
          requestor: "",
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          waiverType: [],
          reason: "",
          workorder: "",
          workorderQty: ""
        });

        setMaterialRows(data.materialRows ?? [
          {
            currentPart: "",
            currentPartDescription: "",
            newPart: "",
            newPartDescription: "",
            action: "",
            instructions: "",
            file: null
          }
        ]);

        setOpenSection(data.openSection ?? []);

        setProcessData(data.processData ?? { instructions: "", file: null });
        setTestData(data.testData ?? { currentPart: "", toBePart: "", instructions: "", file: null });
        setSpecData(data.specData ?? { specImpact: "", instructions: "", file1: null, file2: null });
        setReworkData(data.reworkData ?? { instructions: "", file: null });
        setLabelData(data.labelData ?? { instructions: "", file: null });
      } catch (err) {
        console.error("Load draft failed:", err);
      }
    };

    loadDraft();
  }, [userId]);

  const [waiverId, setWaiverId] = useState(null);

  useEffect(() => {
    if (!waiverId) return;
  
    setFormData((prev) => ({
      ...prev,
      waiverId
    }));
  }, [waiverId]);

  // const [loaded, setLoaded] = useState(false);

  const [formData, setFormData] = useState({
    partNumber: "",
    revision: "",
    description: "",
    subcontractor: "",
    assemblyLevel: "",
    requestor: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    waiverType: [],
    reason: "",
    workorder: "",
    workorderQty: "",
    currentPart: "",
    newPart: "",
    action: "",
    instructions: ""
  });



  const [openSection, setOpenSection] = useState([]);
 
  const [materialRows, setMaterialRows] = useState([
    {
      currentPart: "",
      currentPartDescription: "",
      newPart: "",
      newPartDescription: "",
      action: "",
      instructions: "",
      file: ""
    }
  ]);

  const [processData, setProcessData] = useState({
    instructions: "",
    file: null
  });

  const [testData, setTestData] = useState({
    currentPart: "",
    toBePart: "",
    instructions: "",
    file: null
  });

  const [specData, setSpecData] = useState({
    specImpact: "",
    instructions: "",
    file1: null,
    file2: null
  });

  const [reworkData, setReworkData] = useState({
    instructions: "",
    file: null
  });

  const [labelData, setLabelData] = useState({
    instructions: "",
    file: null
  });

  useEffect(() => {
    if (!userId) return;

    // prevent saving empty initial state
    const isEmpty =
      !formData.partNumber &&
      materialRows.every(r => !r.currentPart && !r.newPart);

    if (isEmpty) return;

    const timeout = setTimeout(async () => {
      try {
        await api.saveDraftDetails({
          userId,
          formData,
          materialRows,
          processData,
          testData,
          specData,
          reworkData,
          labelData,
          openSection
        });
      } catch (error) {
        console.error("Auto-save draft failed:", error);
      }
    }, 1000); // debounce 1s

    return () => clearTimeout(timeout);
  }, [userId,
    formData,
    materialRows,
    processData,
    testData,
    specData,
    reworkData,
    labelData,
    openSection]);


  const handleMaterialChange = (index, field, value) => {
    const updated = [...materialRows];
    updated[index][field] = value;
    setMaterialRows(updated);
  };

  const handleMaterialFileChange = async (index, file) => {
    const updated = [...materialRows];

    const formData = new FormData();
    formData.append("file", file);

    const res = await api.uploadDraft(formData);

    updated[index].file = res.filePath;

    setMaterialRows(updated);
  };

  const handleProcessFileChange = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.uploadDraft(formData);

      setProcessData({
        ...processData,
        file: res.filePath
      });
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleFileChange = async (file, state, setState, field = "file") => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.uploadDraft(formData);

      setState({
        ...state,
        [field]: res.filePath
      });
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const handleReplace = async (state, setState, field = "file") => {
    if (state[field]) {
      try {
        await api.deleteDraftFile({ filePath: state[field] });
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    setState({
      ...state,
      [field]: null
    });
  };

  const handleProcessReplace = async () => {
    if (processData.file) {
      try {
        await api.deleteDraftFile({ filePath: processData.file });
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }

    setProcessData({
      ...processData,
      file: null
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "waiverType") {
      let updatedTypes = [...formData.waiverType];

      if (checked) {
        updatedTypes.push(value);
      } else {
        updatedTypes = updatedTypes.filter((item) => item !== value);
      }

      setFormData({
        ...formData,
        waiverType: updatedTypes
      });

      // 👇 open multiple sections
      const sectionMap = {
        "Material Waiver": "material",
        "Process Waiver": "process",
        "Test Waiver": "test",
        "Spec Deviation": "spec",
        "Rework Waiver": "rework",
        "Label Waiver": "label"
      };

      const sectionsToOpen = updatedTypes.map(type => sectionMap[type]);
      setOpenSection(sectionsToOpen);

    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const addMaterialRow = () => {
    setMaterialRows([
      ...materialRows,
      { currentPart: "", newPart: "", actions: [], instructions: "" }
    ]);
  };

  const removeMaterialRow = (index) => {
    const updated = [...materialRows];
    updated.splice(index, 1);
    setMaterialRows(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Waiver submitted:", formData);
  };

  const handleReplaceClick = async (index) => {
    const updated = [...materialRows];

    const existingFile = updated[index].file;

    // 1. DELETE OLD FILE IMMEDIATELY
    if (existingFile) {
      try {
        await api.deleteDraftFile({ filePath: existingFile });
      } catch (err) {
        console.error("Failed to delete old file:", err);
      }
    }

    // 2. CLEAR UI STATE
    updated[index] = {
      ...updated[index],
      file: null
    };

    setMaterialRows(updated);
  };

  return (
    <div className="waiver-container">

      <div className="title-header" >
        <h4 className="waiver-title" style={{ textAlign: "center" }} >AMD Waiver Request Form</h4>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Product Info */}
        <div className="form-section">
          <div className="waiver-id-row">
            <span className="waiver-label">Waiver ID:</span>
            <span className="waiver-value">{formData.waiverId}</span>
          </div>

          <div className="field-inline">
            <label>AMD Product Part Number:</label>
            <input name="partNumber" value={formData.partNumber || ""} onChange={handleChange} />
          </div>

          <div className="field-inline">
            <label>AMD Product Revision:</label>
            <input name="revision" value={formData.revision || ""} onChange={handleChange} />
          </div>

          <div className="field-inline">
            <label>AMD Product Description:</label>
            <input name="description" value={formData.description || ""} onChange={handleChange} />
          </div>

        </div>

        {/* Subcontractor */}
        <div className="form-section">
          <label>Affected Subcontractor</label>
          {["Sanmina", "Flex", "Pegatron", "Lenovo", "Compal"].map((item) => (
            <label key={item}>
              <input
                type="radio"
                name="subcontractor"
                value={item}
                checked={formData.subcontractor === item}
                onChange={handleChange}
              />
              {item}
            </label>
          ))}
        </div>

        {/* Assembly */}
        <div className="form-section">
          <label>Assembly Level</label>
          {["Board", "Sub-Assembly", "System"].map((item) => (
            <label key={item}>
              <input
                type="radio"
                name="assemblyLevel"
                value={item}
                checked={formData.assemblyLevel === item}
                onChange={handleChange}
              />
              {item}
            </label>
          ))}
        </div>

        {/* Requestor */}
        <div className="form-section">
          <div className="field-inline">
            <label>Requestor Name:</label>
            <input name="requestor" value={formData.requestor || ""} onChange={handleChange} />
          </div>
        </div>

        {/* Dates */}
        <div className="form-section">
          <div className="field-inline">
            <label>Waiver Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <div className="field-inline">
            <label>Waiver End Date</label>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
          </div>
        </div>

        {/* Waiver Type */}
        <div className="form-section">
          <label>Waiver Type</label>
          {[
            "Material Waiver",
            "Process Waiver",
            "Test Waiver",
            "Spec Deviation",
            "Rework Waiver",
            "Label Waiver"
          ].map((item) => (
            <label key={item}>
              <input
                type="checkbox"
                name="waiverType"
                value={item}
                checked={formData.waiverType.includes(item)}
                onChange={handleChange}
              />
              {item}
            </label>
          ))}
        </div>

        {/* Reason */}
        <div className="form-section">
          <div className="field-inline">
            <label>Reason / Justification</label>
            <textarea name="reason" value={formData.reason || ""} onChange={handleChange}></textarea>
          </div>
        </div>

        {/* Workorder */}
        <div className="form-section-row">
          <div className="field-inline">
            <label>Workorder:</label>
            <input name="workorder" value={formData.workorder || ""} onChange={handleChange} />
          </div>

          <div className="field-inline">
            <label>Workorder Qty:</label>
            <input type="number" name="workorderQty" value={formData.workorderQty || ""} onChange={handleChange} />
          </div>
        </div>

        {/* Material Waiver Section */}
        <div className="accordion">
          <div className="accordion-header">
            Material Waiver Details
          </div>


          {openSection.includes("material") && (
            <div className="accordion-body">

              <div className="table-wrapper">
                <table className="material-table">
                  <thead>
                    <tr>
                      <th>Current Part</th>
                      <th>Description</th>
                      <th>New Part</th>
                      <th>Description</th>
                      <th>Action</th>
                      <th>Instructions</th>
                      <th>Attachment (optional)</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {materialRows.map((row, index) => (
                      <tr key={index}>

                        <td>
                          <input
                            className="table-input"
                            placeholder="Part No"
                            value={row.currentPart || ""}
                            onChange={(e) =>
                              handleMaterialChange(index, "currentPart", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <textarea
                            className="table-textarea small"
                            placeholder="Description"
                            value={row.currentPartDescription || ""}
                            onChange={(e) =>
                              handleMaterialChange(index, "currentPartDescription", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <input
                            className="table-input"
                            placeholder="Part No"
                            value={row.newPart || ""}
                            onChange={(e) =>
                              handleMaterialChange(index, "newPart", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <textarea
                            className="table-textarea small"
                            placeholder="Description"
                            value={row.newPartDescription || ""}
                            onChange={(e) =>
                              handleMaterialChange(index, "newPartDescription", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <select
                            className="table-select"
                            value={row.action || ""}
                            onChange={(e) =>
                              handleMaterialChange(index, "action", e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            <option value="Material Substitution">Substitution</option>
                            <option value="Use-as-is">Use-as-is</option>
                            <option value="Rework">Rework</option>
                            <option value="Remove">Remove</option>
                            <option value="Scrap">Scrap</option>
                          </select>
                        </td>

                        <td>
                          <textarea
                            className="table-textarea"
                            placeholder="Instructions..."
                            value={row.instructions || ""}
                            onChange={(e) =>
                              handleMaterialChange(index, "instructions", e.target.value)
                            }
                          />
                        </td>

                        <td>
                          <div className="file-upload">

                            {/* If NO file → show upload */}
                            {!row.file ? (
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleMaterialFileChange(index, e.target.files[0])
                                }
                              />
                            ) : (
                              /* If file exists → show filename + actions */
                              <div className="file-preview">
                                <a
                                  href={`http://localhost:5000${row.file}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="file-link"
                                >
                                  {row.file.split("/").pop()}
                                </a>

                                <button
                                  type="button"
                                  className="replace-btn"
                                  onClick={() => {
                                    handleReplaceClick(index)
                                  }}
                                >
                                  Replace
                                </button>

                              </div>
                            )}

                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => removeMaterialRow(index)}
                          >
                            ✕
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-actions">
                <button type="button" className="add-btn" onClick={addMaterialRow}>
                  + Add Row
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Process Waiver Section */}
        <div className="accordion">
          <div
            className="accordion-header"
          >
            Process Waiver Details
          </div>

          {openSection.includes("process") && (
            <div className="accordion-body">
              <label>Instructions</label>
              <textarea name="processdata instructions" value={processData.instructions} onChange={(e) =>
                setProcessData({ ...processData, instructions: e.target.value })
              }></textarea>

              <div className="file-upload">
                {!processData.file ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0], processData, setProcessData)}
                  />
                ) : (
                  <div className="file-preview">
                    <a
                      href={`http://localhost:5000${processData.file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      {processData.file.split("/").pop()}
                    </a>

                    <button
                      type="button"
                      className="replace-btn"
                      onClick={() =>
                        handleReplace(processData, setProcessData)
                      }
                    >
                      Replace
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>


        {/* test Waiver Section */}
        <div className="accordion">
          <div
            className="accordion-header"
          >
            Test Waiver Details
          </div>

          {openSection.includes("test") && (
            <div className="accordion-body">

              <div className="field-inline">
                <label>Current Part Number:</label>
                <input name="currentpartnum" value={testData.currentPart}
                  onChange={(e) =>
                    setTestData({ ...testData, currentPart: e.target.value })
                  } />

                <label>To Be Part Number:</label>
                <input name="tobepartnum" value={testData.toBePart}
                  onChange={(e) =>
                    setTestData({ ...testData, toBePart: e.target.value })
                  } />
              </div>

              <label>Instructions</label>
              <textarea name="test instructions" value={testData.instructions}
                onChange={(e) =>
                  setTestData({ ...testData, instructions: e.target.value })
                }
              />

              <div className="file-upload">
                {!testData.file ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(e.target.files[0], testData, setTestData)
                    }
                  />
                ) : (
                  <div className="file-preview">
                    <a
                      href={`http://localhost:5000${testData.file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      {testData.file.split("/").pop()}
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        handleReplace(testData, setTestData)
                      }
                    >
                      Replace
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>


        {/* Rework Waiver Section */}
        <div className="accordion">
          <div
            className="accordion-header"
          >
            Rework Waiver Details
          </div>

          {openSection.includes("rework") && (
            <div className="accordion-body">
              <label>Instructions</label>
              <textarea name="rework instructions" value={reworkData.instructions}
                onChange={(e) =>
                  setReworkData({ ...reworkData, instructions: e.target.value })
                }
              />

              <div className="file-upload">
                {!reworkData.file ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0], reworkData, setReworkData)}
                  />
                ) : (
                  <div className="file-preview">
                    <a
                      href={`http://localhost:5000${reworkData.file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      {reworkData.file.split("/").pop()}
                    </a>

                    <button
                      type="button"
                      className="replace-btn"
                      onClick={() =>
                        handleReplace(reworkData, setReworkData)
                      }
                    >
                      Replace
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>


        {/* Spec Waiver Section */}
        <div className="accordion">
          <div
            className="accordion-header"
          >
            Spec Deviation Waiver Details
          </div>

          {openSection.includes("spec") && (
            <div className="accordion-body">
              <label>Specifications/Drawings impacted</label>
              <textarea name="spec impacted" value={specData.specImpact}
                onChange={(e) =>
                  setSpecData({ ...specData, specImpact: e.target.value })
                }></textarea>

              <div className="file-upload">

                {!specData.file1 ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(
                        e.target.files[0],
                        specData,
                        setSpecData,
                        "file1"
                      )
                    }
                  />
                ) : (
                  <div className="file-preview">
                    <a
                      href={`http://localhost:5000${specData.file1}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      {specData.file1.split("/").pop()}
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        handleReplace(specData, setSpecData, "file1")
                      }
                    >
                      Replace
                    </button>
                  </div>
                )}

              </div>
              <label><br></br>Instructions</label>
              <textarea name="spec instructions" value={specData.instructions}
                onChange={(e) =>
                  setSpecData({ ...specData, instructions: e.target.value })
                }></textarea>

              <div className="file-upload">

                {!specData.file2 ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleFileChange(
                        e.target.files[0],
                        specData,
                        setSpecData,
                        "file2"
                      )
                    }
                  />
                ) : (
                  <div className="file-preview">
                    <a
                      href={`http://localhost:5000${specData.file2}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      {specData.file2.split("/").pop()}
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        handleReplace(specData, setSpecData, "file2")
                      }
                    >
                      Replace
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}
        </div>


        {/* Label Waiver Section */}
        <div className="accordion">
          <div
            className="accordion-header"
          >
            Label Waiver Details
          </div>

          {openSection.includes("label") && (
            <div className="accordion-body">

              <label>Instructions</label>
              <textarea name="instructions" value={labelData.instructions}
                onChange={(e) =>
                  setLabelData({ ...labelData, instructions: e.target.value })
                }></textarea>

              <div className="file-upload">
                {!labelData.file ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0], labelData, setLabelData)}
                  />
                ) : (
                  <div className="file-preview">
                    <a
                      href={`http://localhost:5000${labelData.file}`}
                      target="_blank"
                      rel="noreferrer"
                      className="file-link"
                    >
                      {labelData.file.split("/").pop()}
                    </a>

                    <button
                      type="button"
                      className="replace-btn"
                      onClick={() =>
                        handleReplace(labelData, setLabelData)
                      }
                    >
                      Replace
                    </button>
                  </div>
                )}

              </div>


            </div>
          )}
        </div>



        <button type="submit" className="submit-btn">
          SUBMIT
        </button>

      </form>

    </div>
  );
};

export default WaiverForm;