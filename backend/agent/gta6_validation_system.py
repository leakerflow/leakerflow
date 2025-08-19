#!/usr/bin/env python3
"""
GTA 6 Information Validation System
Classifies information by credibility: CONFIRMED/PROBABLE/RUMOR/SPECULATION
"""

from enum import Enum
from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime

class CredibilityLevel(Enum):
    """Credibility levels for GTA 6 information"""
    CONFIRMED = "CONFIRMED"
    PROBABLE = "PROBABLE"
    RUMOR = "RUMOR"
    SPECULATION = "SPECULATION"

class SourceType(Enum):
    """Information source types"""
    ROCKSTAR_OFFICIAL = "rockstar_official"
    TAKE_TWO_OFFICIAL = "take_two_official"
    TRUSTED_INSIDER = "trusted_insider"
    VERIFIED_LEAK = "verified_leak"
    SPECIALIZED_MEDIA = "specialized_media"
    COMMUNITY = "community"
    ANALYTICAL_SPECULATION = "analytical_speculation"

@dataclass
class GTA6Information:
    """Structure for GTA 6 information"""
    content: str
    credibility: CredibilityLevel
    source_type: SourceType
    source_name: str
    date_reported: datetime
    verification_notes: str
    tags: List[str]
    confidence_score: float  # 0.0 a 1.0

class GTA6ValidationSystem:
    """Main GTA 6 information validation system"""
    
    def __init__(self):
        self.confirmed_info = self._load_confirmed_information()
        self.source_reliability = self._load_source_reliability()
        
    def _load_confirmed_information(self) -> List[GTA6Information]:
        """Loads officially confirmed information"""
        return [
            GTA6Information(
                content="Official release in 2025",
                credibility=CredibilityLevel.CONFIRMED,
                source_type=SourceType.ROCKSTAR_OFFICIAL,
                source_name="Rockstar Games",
                date_reported=datetime(2023, 12, 4),
                verification_notes="Officially announced in December 2023 trailer",
                tags=["release_date", "official"],
                confidence_score=1.0
            ),
            GTA6Information(
                content="Setting in Vice City (Leonida)",
                credibility=CredibilityLevel.CONFIRMED,
                source_type=SourceType.ROCKSTAR_OFFICIAL,
                source_name="Rockstar Games",
                date_reported=datetime(2023, 12, 4),
                verification_notes="Shown in the first official trailer",
                tags=["setting", "vice_city", "leonida"],
                confidence_score=1.0
            ),
            GTA6Information(
                content="Two main protagonists: Jason and Lucia",
                credibility=CredibilityLevel.CONFIRMED,
                source_type=SourceType.ROCKSTAR_OFFICIAL,
                source_name="Rockstar Games",
                date_reported=datetime(2023, 12, 4),
                verification_notes="Introduced in the official trailer",
                tags=["protagonists", "jason", "lucia"],
                confidence_score=1.0
            ),
            GTA6Information(
                content="Focus on relationship between protagonists",
                credibility=CredibilityLevel.CONFIRMED,
                source_type=SourceType.ROCKSTAR_OFFICIAL,
                source_name="Rockstar Games",
                date_reported=datetime(2023, 12, 4),
                verification_notes="Narrative shown in the trailer",
                tags=["narrative", "relationship"],
                confidence_score=1.0
            )
        ]
    
    def _load_source_reliability(self) -> Dict[str, float]:
        """Loads source reliability indices"""
        return {
            "Rockstar Games": 1.0,
            "Take-Two Interactive": 1.0,
            "Jason Schreier (Bloomberg)": 0.95,
            "Tom Henderson (Insider Gaming)": 0.90,
            "Chris Klippel (Rockstar Mag)": 0.85,
            "GTAForums Moderators": 0.80,
            "Reddit r/GTA6": 0.30,
            "YouTube Channels": 0.25,
            "Twitter Leakers": 0.20
        }
    
    def classify_information(self, content: str, source_name: str = "Unknown", 
                           source_type: SourceType = SourceType.COMMUNITY, evidence: str = "") -> CredibilityLevel:
        """Classifies information based on source and evidence"""
        
        # Official information is always CONFIRMED
        if source_type in [SourceType.ROCKSTAR_OFFICIAL, SourceType.TAKE_TWO_OFFICIAL]:
            return CredibilityLevel.CONFIRMED
        
        # Check source reliability
        source_reliability = self.source_reliability.get(source_name, 0.0)
        
        # Classify based on reliability
        if source_reliability >= 0.85:
            return CredibilityLevel.PROBABLE
        elif source_reliability >= 0.50:
            return CredibilityLevel.RUMOR
        else:
            return CredibilityLevel.SPECULATION
    
    def validate_against_confirmed(self, content: str) -> bool:
        """Checks if information contradicts confirmed data"""
        # Implement validation logic against confirmed information
        confirmed_contents = [info.content.lower() for info in self.confirmed_info]
        
        # Basic contradiction checks
        content_lower = content.lower()
        
        # Release date contradictions
        if "2024" in content_lower and any("2025" in conf for conf in confirmed_contents):
            return False
        
        # Setting contradictions
        if "liberty city" in content_lower and any("vice city" in conf for conf in confirmed_contents):
            return False
        
        return True
    
    def generate_validation_report(self, information: GTA6Information) -> Dict:
        """Generates validation report for information"""
        is_valid = self.validate_against_confirmed(information.content)
        
        return {
            "content": information.content,
            "credibility_level": information.credibility.value,
            "confidence_score": information.confidence_score,
            "source_reliability": self.source_reliability.get(information.source_name, 0.0),
            "is_valid": is_valid,
            "validation_date": datetime.now().isoformat(),
            "tags": information.tags,
            "verification_notes": information.verification_notes
        }
    
    def get_credibility_guidelines(self) -> Dict[str, str]:
        """Returns guidelines for credibility classification"""
        return {
            "CONFIRMED": "Official information from Rockstar Games or Take-Two Interactive. Announcements, trailers, official press releases.",
            "PROBABLE": "Information from highly reliable sources with proven track record. Specialized journalists, insiders with track record.",
            "RUMOR": "Information from moderately reliable sources or unverified leaks. Requires caution in disclosure.",
            "SPECULATION": "Community theories, speculative analysis, or information from unreliable sources. Must be clearly marked as speculation."
        }
    
    def format_for_article(self, information: GTA6Information) -> str:
        """Formats information for use in articles"""
        credibility_emoji = {
            CredibilityLevel.CONFIRMED: "✅",
            CredibilityLevel.PROBABLE: "🟡",
            CredibilityLevel.RUMOR: "🟠",
            CredibilityLevel.SPECULATION: "🔴"
        }
        
        emoji = credibility_emoji.get(information.credibility, "❓")
        
        return f"{emoji} **{information.credibility.value}**: {information.content}"
    
    def get_information_by_credibility(self, level: CredibilityLevel) -> List[GTA6Information]:
        """Returns information filtered by credibility level"""
        return [info for info in self.confirmed_info if info.credibility == level]
    
    def add_information(self, information: GTA6Information) -> bool:
        """Adds new information to the system"""
        if self.validate_against_confirmed(information.content):
            # In a real implementation, this would be saved to database
            return True
        return False

# Example usage
if __name__ == "__main__":
    validator = GTA6ValidationSystem()
    
    # Example classification
    new_info = GTA6Information(
        content="Map will be 2x larger than GTA V",
        credibility=CredibilityLevel.RUMOR,
        source_type=SourceType.TRUSTED_INSIDER,
        source_name="Tom Henderson (Insider Gaming)",
        date_reported=datetime.now(),
        verification_notes="Based on development leaks",
        tags=["map_size", "world"],
        confidence_score=0.7
    )
    
    # Generate report
    report = validator.generate_validation_report(new_info)
    print(f"Validation report: {report}")
    
    # Format for article
    formatted = validator.format_for_article(new_info)
    print(f"Formatted: {formatted}")