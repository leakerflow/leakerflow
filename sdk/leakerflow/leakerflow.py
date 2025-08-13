from .api import agents, threads
from .agent import LeakerflowAgent
from .thread import LeakerflowThread
from .tools import AgentPressTools, MCPTools


class Leakerflow:
    def __init__(self, api_key: str, api_url="https://api.leakerflow.com/api"):
        self._agents_client = agents.create_agents_client(api_url, api_key)
        self._threads_client = threads.create_threads_client(api_url, api_key)

        self.Agent = LeakerflowAgent(self._agents_client)
        self.Thread = LeakerflowThread(self._threads_client)
