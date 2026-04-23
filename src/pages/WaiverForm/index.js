import React, { useState } from "react";
import "../../assets/css/waiver.css";

const generateWaiverId = () => {
  const year = new Date().getFullYear().toString().slice(-2); // 2026 -> 26

  const runningNumber = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0"); // 001, 002...

  const amendment = "A";

  return `WV${year}${runningNumber}-${amendment}`;
};

const WaiverForm = () => {

  const [formData, setFormData] = useState({
    waiverId: generateWaiverId(),
    partNumber: "",
    revision: "",
    description: "",
    subcontractor: "",
    assemblyLevel: "",
    requestor: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    waiverType: "",
    reason: "",
    workorder: "",
    workorderQty: "",
    currentPart: "",
    newPart: "",
    action: "",
    instructions: ""
  });

  const [openSection, setOpenSection] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setFormData({
      ...formData,
      [name]: value
    });
  
    // 👇 Auto open section when waiver type is selected
    if (name === "waiverType") {
      const sectionMap = {
        "Material Waiver": "material",
        "Process Waiver": "process",
        "Test Waiver": "test",
        "Spec Deviation": "spec",
        "Rework Waiver": "rework",
        "Label Waiver": "label"
      };
  
      setOpenSection(sectionMap[value]);
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? "" : section);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); 
    console.log("Waiver submitted:", formData);
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
            <input name="partNumber" onChange={handleChange} />
          </div>

          <div className="field-inline">
            <label>AMD Product Revision:</label>
            <input name="revision" onChange={handleChange} />
          </div>

          <div className="field-inline">
            <label>AMD Product Description:</label>
            <input name="description" onChange={handleChange} />
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
            <input name="requestor" onChange={handleChange} />
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
            <input type="date" name="endDate" onChange={handleChange} />
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
                type="radio"
                name="waiverType"
                value={item}
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
            <textarea name="reason" onChange={handleChange}></textarea>
          </div>
        </div>

        {/* Workorder */}
        <div className="form-section-row">
          <div className="field-inline">
            <label>Workorder:</label>
            <input name="workorder" onChange={handleChange} />
          </div>

          <div className="field-inline">
            <label>Workorder Qty:</label>
            <input  type="number" name="workorderQty" onChange={handleChange} />
          </div>
        </div>

        {/* Material Waiver Section */}
        <div className="accordion">
          <div className="accordion-header" >
            Material Waiver Details
          </div>

          {openSection === "material" && (
            <div className="accordion-body">
              <div className="field-inline">
                <label>Current Part Number:</label>
                <input name="currentPart" onChange={handleChange} />


                <label>To Be Part Number:</label>
                <input name="newPart" onChange={handleChange} />
              </div>

              <div className="radio-group">
                <label>Actions</label>

                {[
                  "Material Substitution",
                  "Use-as-is",
                  "Rework",
                  "Remove",
                  "Scrap"
                ].map((item) => (
                  <label key={item} className="radio-item">
                    <input
                      type="radio"
                      name="action"
                      value={item}
                      onChange={handleChange}
                    />
                    {item}
                  </label>
                ))}
              </div>

              <label><br></br>Instructions</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />
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

          {openSection === "process" && (
            <div className="accordion-body">
              <label>Instructions</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />

            </div>
          )}
        </div>


        {/* Process Waiver Section */}
        <div className="accordion">
          <div
            className="accordion-header"
          >
            Test Waiver Details
          </div>

          {openSection === "test" && (
            <div className="accordion-body">

              <div className="field-inline">
                <label>Current Part Number:</label>
                <input name="currentpartnum" onChange={handleChange} />

                <label>To Be Part Number:</label>
                <input name="tobepartnum" onChange={handleChange} />
              </div>

              <label>Instructions</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />

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

          {openSection === "rework" && (
            <div className="accordion-body">
              <label>Instructions</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />

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

          {openSection === "spec" && (
            <div className="accordion-body">
              <label>Specifications/Drawings impacted</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />

              <label><br></br><br></br>Instructions</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />

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

          {openSection === "label" && (
            <div className="accordion-body">

              <label>Instructions</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />

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