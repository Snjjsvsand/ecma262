import { GlobalEnvironmentRecord } from "../Environment Records/Environment Records"
import { ExecutionContext } from "./ExecutionContext"
import { agent } from './Agent'
import { newGlobalEnvironment } from "../Environment Records/Environment Record Operations"


class RealmRecord {
    intrinsics: any
    globalObject: Object | undefined
    globalEnv: GlobalEnvironmentRecord | undefined
    templateMap: Array<any> 
    hostDefined = undefined
}

function initializeHostDefinedRealm() {
    let realm = createRealm()
    let newContext = new ExecutionContext()
    
    newContext.function = null
    newContext.scriptOrModule = null
    /*
        This Execution Context is created by base class ExecutionContext,
        and it do not have environment record fields,
        but it has a realm field which own a globalEnv. 
    */
    newContext.realm = realm
    
    agent.executionContextStack.push(newContext)
    agent.runningExecutionContext = newContext

    let global = globalThis , thisValue = globalThis

    // create host-defined global object such as window.
    setRealmGlobalObject(realm , global , thisValue)

    // ?? 
    let globalObj = setDefaultGlobalBinding(realm)

    return realm
}

function createIntrinsics(realmRec: RealmRecord) {
    realmRec.intrinsics = {
        Array: Array,
        Boolean: Boolean,
        Object: Object
        // ... 必要内置对象
    }

}

function createRealm() {
    let realmRec = new RealmRecord()

    createIntrinsics(realmRec)
    realmRec.globalObject = undefined
    realmRec.globalEnv = undefined
    realmRec.templateMap = []
    
    return realmRec
}

function setRealmGlobalObject(realmRec: RealmRecord , globalObj: Object , thisValue: any) {
    if(globalObj === undefined) globalObj = Object.create(realmRec.intrinsics)
    if(thisValue === undefined) thisValue = globalObj

    let newGlobalEnv = newGlobalEnvironment(globalObj , thisValue)

    realmRec.globalObject = globalObj
    realmRec.globalEnv = newGlobalEnv
}

function setDefaultGlobalBinding(realmRec: RealmRecord) {
    let global = realmRec.globalObject
    // ???
    return global
}

export {
    RealmRecord,
    initializeHostDefinedRealm
}

