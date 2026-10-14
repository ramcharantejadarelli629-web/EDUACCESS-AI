"""Response schemas for EduAccess AI API."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GlossaryItem(BaseModel):
    """An educational glossary term with definition and context."""
    term: str = Field(description="The academic or technical term.")
    definition: str = Field(description="Clear, accessible definition.")
    simplified_context: str = Field(description="How this term applies to the material.")


class ChecklistItem(BaseModel):
    """An actionable, structured study checklist item with stable ID."""
    id: str = Field(description="Unique stable identifier for the checklist item.")
    task: str = Field(description="Actionable study micro-task.")
    completed: bool = Field(default=False, description="Completion state.")
    estimated_minutes: Optional[int] = Field(default=5, description="Estimated time to complete in minutes.")


class ComprehensionQuestion(BaseModel):
    """Source-faithful comprehension check."""
    id: str = Field(description="Unique question identifier.")
    question: str = Field(description="The comprehension question.")
    options: List[str] = Field(description="Multiple choice options (usually 3 or 4).")
    correct_index: int = Field(description="Zero-based index of the correct answer.")
    explanation: str = Field(description="Concise rationale based directly on the source content.")


class TextSimplificationResponse(BaseModel):
    """Structured response for cognitive text simplification."""
    concise_summary: str = Field(description="A brief 2-3 sentence overview.")
    simplified_explanation: str = Field(description="Structured, accessible explanation preserving meaning.")
    reading_level: str = Field(description="Applied reading level: simple, standard, or detailed.")
    key_concepts: List[str] = Field(description="Bullet-point list of primary concepts.")
    essential_facts: List[str] = Field(description="Crucial facts that must not be lost or altered.")
    step_by_step_processes: List[str] = Field(default_factory=list, description="Numbered breakdown of complex flows.")
    glossary: List[GlossaryItem] = Field(default_factory=list, description="Academic terminology translated to clear terms.")
    study_checklist: List[ChecklistItem] = Field(default_factory=list, description="Actionable micro-tasks.")
    comprehension_questions: List[ComprehensionQuestion] = Field(default_factory=list, description="Knowledge checks.")
    formulas_and_relationships: List[str] = Field(default_factory=list, description="Important equations, laws, or formulas.")
    ambiguities_or_warnings: List[str] = Field(default_factory=list, description="Noted ambiguities or limitations in source text.")
    source_references: Optional[str] = Field(default=None, description="Identified source or citation context.")
    word_count_original: int = Field(description="Original input word count.")
    word_count_simplified: int = Field(description="Simplified explanation word count.")
    is_mock: bool = Field(default=False, description="Flag indicating if generated via honest test/fallback mode.")


class ChartTrendData(BaseModel):
    """Structured trend and axis data extracted from charts or graphs."""
    chart_type: Optional[str] = None
    x_axis_label: Optional[str] = None
    y_axis_label: Optional[str] = None
    observed_data_points: List[str] = Field(default_factory=list, description="Directly readable numbers and categories.")
    inferred_trends: List[str] = Field(default_factory=list, description="Clear distinctions between observed data and inferred trends.")


class DiagramExplanationResponse(BaseModel):
    """Structured response for multimodal visual diagram / chart explanation."""
    overview: str = Field(description="Concise executive summary of what the visual depicts.")
    visual_type: str = Field(description="Visual category, e.g. flowchart, biology schematic, scatter plot, architectural diagram.")
    layout_description: str = Field(description="Accessible description of spatial arrangement and visual regions.")
    main_objects_and_labels: List[str] = Field(description="Identifiable entities, components, or labels.")
    relationships_and_flows: List[str] = Field(description="Connections, sequence of steps, or hierarchical relationships.")
    chart_data: Optional[ChartTrendData] = Field(default=None, description="Axis labels, units, and trends when applicable.")
    mathematical_elements: List[str] = Field(default_factory=list, description="Recognizable equations, symbols, or formula notation.")
    logical_reading_order: List[str] = Field(description="Recommended step-by-step reading order for screen-reader / cognitive navigation.")
    audio_friendly_narration: str = Field(description="Natural, flowing narrative script optimized for speech synthesis.")
    short_summary: str = Field(description="Quick 1-2 sentence description for alt-text or quick scanning.")
    detailed_explanation: str = Field(description="Exhaustive academic explanation of the visual concepts.")
    uncertainties_or_unclear_elements: List[str] = Field(default_factory=list, description="Explicit statements about blurry, occluded, or ambiguous labels.")
    source_metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata such as filename, format, dimensions, page number.")
    is_mock: bool = Field(default=False, description="Flag indicating if generated via honest test/fallback mode.")


class PagePreview(BaseModel):
    """Metadata and preview for a single PDF page."""
    page_number: int
    text_length: int
    preview_snippet: str
    has_images: bool


class PdfInspectionResponse(BaseModel):
    """Response when inspecting an uploaded PDF for page selection."""
    filename: str
    total_pages: int
    pages: List[PagePreview]
    file_size_bytes: int


class UrlExtractionResponse(BaseModel):
    """Response containing extracted article text and its accessible simplification."""
    source_url: str
    page_title: str
    extracted_text_length: int
    simplification: TextSimplificationResponse


class HealthStatusResponse(BaseModel):
    """Liveness check response."""
    status: str = "alive"
    timestamp: str
    version: str = "1.0.0"


class ReadinessStatusResponse(BaseModel):
    """Readiness check response."""
    status: str
    ai_configured: bool
    mock_ai_mode: bool
    environment: str
    model: str
