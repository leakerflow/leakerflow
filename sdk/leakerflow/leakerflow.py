from .api import agents, threads
from .agent import LeakerFlowAgent
from .thread import LeakerFlowThread
from .tools import AgentPressTools, MCPTools


class LeakerFlow:
    def __init__(self, api_key: str, api_url="https://leakerflow.com/api"):
        self._agents_client = agents.create_agents_client(api_url, api_key)
        self._threads_client = threads.create_threads_client(api_url, api_key)

        self.Agent = LeakerFlowAgent(self._agents_client)
        self.Thread = LeakerFlowThread(self._threads_client)
