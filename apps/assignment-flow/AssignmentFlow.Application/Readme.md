 Grading & Assessment Business and Domain Modeling

This document outlines the business requirements, core concepts, behaviors, and proposed data/domain model for a grading system intended to grade submissions and support ongoing assessment adjustments.

## Business Context

- The system supports a separation of concerns, using **vertical slice architecture**, **Domain Driven Design**, and event-driven integration (EventFlow).
- **Grading** focuses on the evaluation of student submissions using a predefined rubric.
- **Assessment** captures the outcome of a grading process, including any subsequent adjustments.

---

## Core Concepts & Requirements

### Key Requirements

1. **Grading Submissions**
    - A Grading process evaluates **many submissions**, each submitted by a student, using a Rubric (criteria, levels, weights).
    - Each submission is its own aggregate with a complete lifecycle that includes creation, file attachment references, and metadata.
    - Each submission is graded individually through the Grading process.

2. **Assessment Adjustments**
    - Assessment results for individual submissions can be changed (e.g. via regrade/appeal/AI moderation).
    - Each adjustment is recorded as a transaction, capturing:
      - Final score after adjustment,
      - Delta (how much it changed),
      - Who/what made the adjustment (Teacher, AI, etc.),
      - Reason/source.

3. **Traceability & Audit**
    - Each grading, submission, assessment, and adjustment must be traceable and auditable.

4. **Submission as Aggregate**
    - Submission is an aggregate root with its own lifecycle.
    - File and attachment information is included at submission creation time.
    - The Submission aggregate is responsible for maintaining its own integrity.

5. **Bounded Context Separation**
    - Submissions exist in their own bounded context
    - Grading is a process/saga that orchestrates interactions between Submissions and Assessments
    - All assessment-related adjustments are managed _inside_ the Assessment bounded context.

---

## Business Model

### Entities & Value Objects

- **Rubric:** Defines the rules, criteria, levels and weights.
- **Teacher:** Educator performing the grading.
- **Grading (Process/Saga):** Orchestrates the grading workflow, referencing submissions by ID and coordinating assessment creation.
- **Submission (Aggregate):** Student's submitted work including references to attached files/evidence.
- **Assessment (Aggregate):** Result of grading a specific submission, subject to adjustments.
- **AssessmentAdjustment (Transaction):** One adjustment of the assessment, keeping a record of what, how, by whom.
- **CriterionAttachmentsSelector:** Maps rubric criteria to evidence in submission (passed as part of grading commands, not stored).

**Relationship:**
- A Grading process involves multiple Submissions (by reference)
- Each Submission can be graded to produce one Assessment
- Each Assessment can have many AssessmentAdjustments

---

## Behaviors

### Submission Management
- **CreateSubmission:** Student or system creates a new submission with attached files/evidence
- **FinalizeSubmission:** Mark a submission as ready for grading

### Grading (Process/Saga)

- **StartGrading:** Teacher (or AI) initiates grading using a Rubric, referencing a set of Submission IDs.
- **AssignSubmissionForGrading:** Associate a specific submission with a grader.
- **GradeSubmission:** System evaluates a submission according to Rubric, producing an Assessment.
- When Assessment is created, Submission is updated with a reference to its Assessment.

### Assessment Adjustments

- **RequestAdjustment:** For a specific Assessment, an actor (teacher, AI, admin) suggests a score review/change, specifying new score, delta, and reasoning.
- **ApplyAdjustment:** System records a new `AssessmentAdjustment` transaction capturing source, delta, and resulting final score.
- **Assessment History:** Each Assessment is a chain of adjustments, with the most recent representing the current "final" score.

### Read Model

- **Query Assessment/History:** Retrieve the latest score and the full audit trail of adjustments with source/timestamp for each submission.

---

## Implementation Patterns

1. **Event-Driven Integration**
   - Submission creation emits events that can trigger workflow processes
   - Assessment creation updates Submission through event handlers
   - All adjustments generate auditable events

2. **Process/Saga Coordination**
   - Grading is modeled as a process manager or saga that:
     - Tracks which submissions need grading
     - Assigns graders
     - Monitors progress
     - Initiates assessment creation
   - No business state duplication between contexts

3. **File Selection Simplification**
   - File mappings are included in submission creation
   - Criterion-to-evidence mapping is passed as a command parameter during grading
   - No need to persist the mapping process itself

---

## Data Model (Conceptual)