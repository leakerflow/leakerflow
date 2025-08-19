#!/usr/bin/env python3
"""
Ferramenta de Validação GTA 6
Integra o sistema de validação de informações no framework do agente
"""

import json
from typing import Dict, Any, List, Optional
from agentpress.tool import Tool, SchemaType
from agent.gta6_validation_system import (
    GTA6ValidationSystem, 
    CredibilityLevel, 
    SourceType, 
    GTA6Information
)
from datetime import datetime

class GTA6ValidationTool(Tool):
    """
    Ferramenta para validar informações sobre GTA 6 usando o sistema de credibilidade
    """
    
    name = "gta6_validation"
    description = "Valida informações sobre GTA 6 usando sistema de credibilidade (CONFIRMADO/PROVÁVEL/RUMOR/ESPECULAÇÃO)"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.validation_system = GTA6ValidationSystem()
    
    @property
    def parameters(self) -> SchemaType:
        return {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["validate_info", "classify_source", "get_confirmed_info", "generate_report"],
                    "description": "Ação a ser executada pelo sistema de validação"
                },
                "information": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string", "description": "Título da informação"},
                        "content": {"type": "string", "description": "Conteúdo da informação"},
                        "source_name": {"type": "string", "description": "Nome da fonte"},
                        "source_type": {
                            "type": "string",
                            "enum": ["OFICIAL", "INSIDER", "MIDIA", "COMUNIDADE", "VAZAMENTO"],
                            "description": "Tipo da fonte"
                        },
                        "date_published": {"type": "string", "description": "Data de publicação (YYYY-MM-DD)"},
                        "url": {"type": "string", "description": "URL da fonte (opcional)"}
                    },
                    "required": ["title", "content", "source_name", "source_type"],
                    "description": "Informação a ser validada (necessário para validate_info)"
                },
                "source_name": {
                    "type": "string",
                    "description": "Nome da fonte para classificação (necessário para classify_source)"
                },
                "topic_filter": {
                    "type": "string",
                    "description": "Filtro por tópico para buscar informações confirmadas (opcional)"
                }
            },
            "required": ["action"]
        }
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Executa a validação de informações GTA 6
        """
        try:
            action = kwargs.get("action")
            
            if action == "validate_info":
                return await self._validate_information(kwargs.get("information", {}))
            elif action == "classify_source":
                return await self._classify_source(kwargs.get("source_name", ""))
            elif action == "get_confirmed_info":
                return await self._get_confirmed_info(kwargs.get("topic_filter"))
            elif action == "generate_report":
                return await self._generate_validation_report()
            else:
                return {
                    "success": False,
                    "error": f"Ação não reconhecida: {action}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro na validação: {str(e)}"
            }
    
    async def _validate_information(self, info_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida uma informação específica sobre GTA 6
        """
        try:
            # Converte dados para objeto GTA6Information
            source_type = SourceType(info_data.get("source_type", "COMUNIDADE"))
            
            # Parse da data
            date_published = None
            if info_data.get("date_published"):
                try:
                    date_published = datetime.strptime(info_data["date_published"], "%Y-%m-%d")
                except ValueError:
                    date_published = datetime.now()
            else:
                date_published = datetime.now()
            
            gta6_info = GTA6Information(
                title=info_data.get("title", ""),
                content=info_data.get("content", ""),
                source_name=info_data.get("source_name", ""),
                source_type=source_type,
                date_published=date_published,
                url=info_data.get("url")
            )
            
            # Classifica a informação
            classified_info = self.validation_system.classify_information(gta6_info)
            
            # Valida contra dados confirmados
            validation_result = self.validation_system.validate_against_confirmed(classified_info)
            
            return {
                "success": True,
                "validation_result": {
                    "title": classified_info.title,
                    "credibility_level": classified_info.credibility_level.value,
                    "confidence_score": classified_info.confidence_score,
                    "source_reliability": classified_info.source_reliability,
                    "validation_status": validation_result["status"],
                    "conflicts": validation_result.get("conflicts", []),
                    "supporting_evidence": validation_result.get("supporting_evidence", []),
                    "classification_reasons": classified_info.classification_reasons,
                    "formatted_for_article": self.validation_system.format_for_article(classified_info)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro na validação da informação: {str(e)}"
            }
    
    async def _classify_source(self, source_name: str) -> Dict[str, Any]:
        """
        Classifica a confiabilidade de uma fonte
        """
        try:
            reliability = self.validation_system.get_source_reliability(source_name)
            
            return {
                "success": True,
                "source_classification": {
                    "source_name": source_name,
                    "reliability_score": reliability,
                    "classification": self._get_reliability_classification(reliability),
                    "recommendations": self._get_source_recommendations(reliability)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro na classificação da fonte: {str(e)}"
            }
    
    async def _get_confirmed_info(self, topic_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna informações confirmadas sobre GTA 6
        """
        try:
            confirmed_info = self.validation_system.confirmed_information
            
            if topic_filter:
                # Filtra por tópico
                filtered_info = {
                    key: value for key, value in confirmed_info.items()
                    if topic_filter.lower() in key.lower() or topic_filter.lower() in value.lower()
                }
            else:
                filtered_info = confirmed_info
            
            return {
                "success": True,
                "confirmed_information": {
                    "total_items": len(filtered_info),
                    "filter_applied": topic_filter,
                    "information": filtered_info
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro ao buscar informações confirmadas: {str(e)}"
            }
    
    async def _generate_validation_report(self) -> Dict[str, Any]:
        """
        Gera relatório de validação
        """
        try:
            # Simula algumas informações para o relatório
            sample_info = GTA6Information(
                title="Análise de Credibilidade GTA 6",
                content="Relatório de validação do sistema",
                source_name="Sistema de Validação",
                source_type=SourceType.OFICIAL,
                date_published=datetime.now()
            )
            
            classified_sample = self.validation_system.classify_information(sample_info)
            report = self.validation_system.generate_validation_report([classified_sample])
            
            return {
                "success": True,
                "validation_report": {
                    "report_generated": datetime.now().isoformat(),
                    "system_status": "Operacional",
                    "total_sources": len(self.validation_system.source_reliability),
                    "confirmed_facts": len(self.validation_system.confirmed_information),
                    "credibility_levels": {
                        level.value: f"Nível {level.value}" for level in CredibilityLevel
                    },
                    "source_types": {
                        source_type.value: f"Tipo {source_type.value}" for source_type in SourceType
                    },
                    "sample_report": report
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Erro na geração do relatório: {str(e)}"
            }
    
    def _get_reliability_classification(self, score: float) -> str:
        """
        Classifica a confiabilidade baseada no score
        """
        if score >= 0.9:
            return "MUITO_CONFIÁVEL"
        elif score >= 0.7:
            return "CONFIÁVEL"
        elif score >= 0.5:
            return "MODERADAMENTE_CONFIÁVEL"
        elif score >= 0.3:
            return "POUCO_CONFIÁVEL"
        else:
            return "NÃO_CONFIÁVEL"
    
    def _get_source_recommendations(self, score: float) -> List[str]:
        """
        Retorna recomendações baseadas no score de confiabilidade
        """
        if score >= 0.9:
            return [
                "Fonte altamente confiável",
                "Pode ser usada como referência principal",
                "Informações podem ser publicadas com confiança"
            ]
        elif score >= 0.7:
            return [
                "Fonte confiável",
                "Recomenda-se verificação cruzada",
                "Adequada para artigos informativos"
            ]
        elif score >= 0.5:
            return [
                "Fonte moderadamente confiável",
                "Necessária verificação com múltiplas fontes",
                "Use com cautela em artigos"
            ]
        elif score >= 0.3:
            return [
                "Fonte pouco confiável",
                "Requer verificação extensiva",
                "Marque claramente como rumor/especulação"
            ]
        else:
            return [
                "Fonte não confiável",
                "Não recomendada para publicação",
                "Use apenas como ponto de partida para investigação"
            ]