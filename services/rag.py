from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

model = OllamaLLM(model="llama3.2")
template = """
you are a ground water research bot which answers the user query based on the give information 
here are some releveant reviews :{policy}
here are some questions to answer from :{question}
"""

prompt = ChatPromptTemplate.from_template(template)
chain = prompt | model

question = "how are you , what is the ground water level on Maharashtra"

policy = retriever.invoike(question)
result = chain.invoke({"policy":[], "question":question})
print(result)