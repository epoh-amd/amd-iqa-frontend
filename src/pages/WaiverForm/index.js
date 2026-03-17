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

  const [openSection, setOpenSection] = useState("material");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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

      <h2 className="waiver-title">AMD Waiver Request Form</h2>

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
          <label>Waiver Start Date</label>
          <input type="date" name="startDate" value={formData.startDate} readOnly />

          <label>Waiver End Date</label>
          <input type="date" name="endDate" onChange={handleChange} />
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
          <label>Reason / Justification</label>
          <textarea name="reason" onChange={handleChange}></textarea>
        </div>

        {/* Workorder */}
        <div className="form-section-row">
          <div>
            <label>Workorder</label>
            <input name="workorder" onChange={handleChange} />
          </div>

          <div>
            <label>Workorder Qty</label>
            <input name="workorderQty" onChange={handleChange} />
          </div>
        </div>

        {/* Material Waiver Section */}
        <div className="accordion">

          <div className="accordion-header" onClick={() => toggleSection("material")}>
            Material Waiver Details
          </div>

          {openSection === "material" && (
            <div className="accordion-body">

              <label>Current Part Number</label>
              <input name="currentPart" onChange={handleChange} />

              <label>To Be Part Number</label>
              <input name="newPart" onChange={handleChange} />

              <label>Actions</label>
              {["Material Substitution", "Use-as-is", "Rework", "Remove", "Scrap"].map((item) => (
                <label key={item}>
                  <input
                    type="radio"
                    name="action"
                    value={item}
                    onChange={handleChange}
                  />
                  {item}
                </label>
              ))}

              <label>Instructions</label>
              <textarea name="instructions" onChange={handleChange}></textarea>

              <input type="file" />
            </div>
          )}

        </div>

        {/* Other waiver sections */}
        {["Process Waiver Details", "Test Waiver Details", "Rework Waiver Details", "Spec Deviation Waiver Details", "Label Waiver Details"]
          .map((section) => (
            <div key={section} className="accordion">
              <div className="accordion-header">
                {section}
              </div>
            </div>
          ))}

        <button type="submit" className="submit-btn">
          SUBMIT
        </button>

      </form>

    </div>
  );
};

export default WaiverForm;