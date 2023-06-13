import { ExecutionContext, ExecutionContextStack } from "./ExecutionContext"

class Agent {
    exectuingThread: any
    runningExecutionContext: ExecutionContext
    executionContextStack: ExecutionContextStack
}

const agent = new Agent()

export {
    agent
} 