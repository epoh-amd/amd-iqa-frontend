// frontend/src/components/common/MultiSelectDropdown.js

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

const MultiSelectDropdown = ({
  options = [],
  selectedValues = [],
  onSelectionChange,
  placeholder = "Select options...",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      // Focus search input when opening
      if (!isOpen) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  };

  const handleOptionClick = (value) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    onSelectionChange(newSelectedValues);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all
      onSelectionChange(options.map(option => option.value));
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    } else if (selectedValues.length === 1) {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : selectedValues[0];
    } else {
      return `${selectedValues.length} selected`;
    }
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const label = option.label || '';
    const value = option.value || '';
    return (
      label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className={`multi-select-dropdown ${className}`} ref={dropdownRef}>
      <div 
        className={`dropdown-header ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <span className="dropdown-text">{getDisplayText()}</span>
        <FontAwesomeIcon 
          icon={faChevronDown} 
          className={`dropdown-arrow ${isOpen ? 'rotated' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="dropdown-content">
          {options.length > 0 && (
            <>
              {/* Search Input */}
              <div className="dropdown-search">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Action Buttons */}
              <div className="dropdown-header-actions">
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleSelectAll}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  {selectedValues.length === options.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedValues.length > 0 && (
                  <button
                    type="button"
                    className="action-btn clear-btn"
                    onClick={handleClearAll}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                    Clear
                  </button>
                )}
              </div>

              {/* Filtered Options */}
              <div className="dropdown-options">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`dropdown-option ${selectedValues.includes(option.value) ? 'selected' : ''}`}
                      onClick={() => handleOptionClick(option.value)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        onChange={() => {}} // Handled by parent click
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="option-label">{option.label}</span>
                      {selectedValues.includes(option.value) && (
                        <FontAwesomeIcon icon={faCheck} className="check-icon" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-options">No matches found for "{searchTerm}"</div>
                )}
              </div>
            </>
          )}
          {options.length === 0 && (
            <div className="no-options">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
