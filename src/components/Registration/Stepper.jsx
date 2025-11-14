import React from "react";
import "./Stepper.css";

const Stepper = ({ steps, currentStep }) => {
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div
            className={`stepper-step ${
              currentStep === step.number
                ? "active"
                : currentStep > step.number
                ? "completed"
                : ""
            }`}
          >
            <div className="stepper-circle">
              {currentStep > step.number ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="stepper-icon">{step.icon}</span>
              )}
            </div>
            <div className="stepper-label">
              <span className="stepper-title">{step.title}</span>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`stepper-line ${
                currentStep > step.number ? "completed" : ""
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;
