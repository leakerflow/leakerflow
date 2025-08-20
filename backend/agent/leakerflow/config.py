import datetime
from typing import Dict, Any, List
from agent.prompt import SYSTEM_PROMPT

class LeakerFlowConfig:
    NAME = "LeakerFlow"
    DESCRIPTION = "LeakerFlow is your AI assistant with access to various tools and integrations to help you with tasks across domains."
    AVATAR = "🌞"
    AVATAR_COLOR = "#F59E0B"
    DEFAULT_MODEL = "anthropic/claude-sonnet-4-20250514"
    SYSTEM_PROMPT = SYSTEM_PROMPT

    DEFAULT_TOOLS = {
        # Core mandatory tools
        "task_list_tool": True,
        "message_tool": True,
        "expand_msg_tool": True,
        
        # GTA 6 specialized tools
        "gta6_demand_tool": True,
        "gta6_validation_tool": True,
        
        # Content creation tools
        "article_creation_tool": True,
        "web_search_tool": True,
        
        # Sandbox tools
        "sb_shell_tool": True,
        "sb_browser_tool": True,
        "sb_deploy_tool": True,
        "sb_expose_tool": True,
        "sb_vision_tool": True,
        "sb_image_edit_tool": True,
        "sb_sheets_tool": True,
        "sb_files_tool": True,
        "sb_templates_tool": True,
        "sb_web_dev_tool": True,
        
        # Advanced tools
        "browser_tool": True,
        "computer_use_tool": True,
        "data_providers_tool": True,
        "mcp_tool_wrapper": True,
    }
    
    DEFAULT_MCPS = []
    DEFAULT_CUSTOM_MCPS = []
    
    USER_RESTRICTIONS = {
        "system_prompt_editable": False,
        "tools_editable": False, 
        "name_editable": False,
        "description_editable": True,
        "mcps_editable": True
    }
    
    @classmethod
    def get_system_prompt(cls) -> str:
        return cls.SYSTEM_PROMPT
    
    @classmethod
    def get_full_config(cls) -> Dict[str, Any]:
        return {
            "name": cls.NAME,
            "description": cls.DESCRIPTION,
            "system_prompt": cls.get_system_prompt(),
            "model": cls.DEFAULT_MODEL,
            "configured_mcps": cls.DEFAULT_MCPS,
            "custom_mcps": cls.DEFAULT_CUSTOM_MCPS,
            "agentpress_tools": cls.DEFAULT_TOOLS,
            "is_default": True,
            "avatar": cls.AVATAR,
            "avatar_color": cls.AVATAR_COLOR,
            "metadata": {
                "is_leakerflow_default": True,
                "centrally_managed": True,
                "restrictions": cls.USER_RESTRICTIONS,
                "installation_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "last_central_update": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        }


def add_tool(tool_name: str, description: str, enabled: bool = True):
    LeakerFlowConfig.DEFAULT_TOOLS[tool_name] = {
        "enabled": enabled,
        "description": description
    }

def remove_tool(tool_name: str):
    if tool_name in LeakerFlowConfig.DEFAULT_TOOLS:
        del LeakerFlowConfig.DEFAULT_TOOLS[tool_name]

def enable_tool(tool_name: str):
    if tool_name in LeakerFlowConfig.DEFAULT_TOOLS:
        LeakerFlowConfig.DEFAULT_TOOLS[tool_name]["enabled"] = True

def disable_tool(tool_name: str):  
    if tool_name in LeakerFlowConfig.DEFAULT_TOOLS:
        LeakerFlowConfig.DEFAULT_TOOLS[tool_name]["enabled"] = False