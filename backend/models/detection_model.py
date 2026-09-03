from typing import Literal

from pydantic import BaseModel, Field, model_validator


class BoundingBox(BaseModel):
    x1: int = Field(ge=0)
    y1: int = Field(ge=0)
    x2: int = Field(ge=0)
    y2: int = Field(ge=0)

    @model_validator(mode="after")
    def validate_coordinates(self):
        if self.x2 <= self.x1:
            raise ValueError("x2 must be greater than x1")

        if self.y2 <= self.y1:
            raise ValueError("y2 must be greater than y1")

        return self


class DetectionInput(BaseModel):
    image_id: str
    model_version: str
    class_id: int = Field(ge=0)
    class_name: str
    confidence: float = Field(ge=0, le=1)
    bbox: BoundingBox


class DetectionFilterUpdate(BaseModel):
    status: Literal["pending", "accepted", "rejected"]
    reason: str | None = None