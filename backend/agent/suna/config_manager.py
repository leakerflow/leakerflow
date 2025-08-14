import datetime
from typing import Dict, Any
from dataclasses import dataclass
from agent.leakerflow.config import LeakerFlowConfig


@dataclass
class LeakerFlowConfiguration:
    name: str
    description: str
    configured_mcps: list
    custom_mcps: list
    restrictions: Dict[str, Any]
    version_tag: str


class LeakerFlowConfigManager:
    def get_current_config(self) -> LeakerFlowConfiguration:
        version_tag = self._generate_version_tag()
        
        return LeakerFlowConfiguration(
            name=LeakerFlowConfig.NAME,
            description=LeakerFlowConfig.DESCRIPTION,
            configured_mcps=LeakerFlowConfig.DEFAULT_MCPS.copy(),
            custom_mcps=LeakerFlowConfig.DEFAULT_CUSTOM_MCPS.copy(),
            restrictions=LeakerFlowConfig.USER_RESTRICTIONS.copy(),
            version_tag=version_tag
        )
    
    def has_config_changed(self, last_version_tag: str) -> bool:
        current = self.get_current_config()
        return current.version_tag != last_version_tag
    
    def validate_config(self, config: LeakerFlowConfiguration) -> tuple[bool, list[str]]:
        errors = []
        
        if not config.name.strip():
            errors.append("Name cannot be empty")
            
        return len(errors) == 0, errors
    
    def _generate_version_tag(self) -> str:
        import hashlib
        import json
        
        config_data = {
            "name": LeakerFlowConfig.NAME,
            "description": LeakerFlowConfig.DESCRIPTION,
            "system_prompt": LeakerFlowConfig.get_system_prompt(),
            "default_tools": LeakerFlowConfig.DEFAULT_TOOLS,
            "avatar": LeakerFlowConfig.AVATAR,
            "avatar_color": LeakerFlowConfig.AVATAR_COLOR,
            "restrictions": LeakerFlowConfig.USER_RESTRICTIONS,
        }
        
        config_str = json.dumps(config_data, sort_keys=True)
        hash_obj = hashlib.md5(config_str.encode())
        return f"config-{hash_obj.hexdigest()[:8]}" 