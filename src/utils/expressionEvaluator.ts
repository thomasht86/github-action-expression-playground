import { ExpressionResult, EvaluationContext } from '../types'

export class ExpressionEvaluator {
  private context: EvaluationContext

  constructor(context: EvaluationContext) {
    this.context = context
  }

  async evaluateExpression(expression: string): Promise<ExpressionResult> {
    try {
      // Clean the expression - remove ${{ }} wrapper if present
      const cleanExpression = expression
        .replace(/^\$\{\{\s*/, '')
        .replace(/\s*\}\}$/, '')
        .trim()

      if (!cleanExpression) {
        throw new Error('Empty expression')
      }

      const result = this.parseAndEvaluate(cleanExpression)
      return { ...result, success: true }
    } catch (error) {
      return {
        value: null,
        type: 'error',
        contextHits: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }
    }
  }

  private parseAndEvaluate(expression: string): ExpressionResult {
    const contextHits: string[] = []

    // Handle function calls like success(), failure(), always()
    if (expression.match(/^(success|failure|always|cancelled)\(\)$/)) {
      const funcName = expression.replace('()', '')
      const value = this.evaluateStatusFunction(funcName)
      return {
        value,
        type: 'boolean',
        contextHits: [`functions.${funcName}`]
      } as ExpressionResult
    }

    // Handle contains() function
    if (expression.match(/^contains\(/)) {
      return this.evaluateContainsFunction(expression, contextHits)
    }

    // Handle startsWith() and endsWith() functions
    if (expression.match(/^(startsWith|endsWith)\(/)) {
      return this.evaluateStringFunction(expression, contextHits)
    }

    // Handle format() function
    if (expression.match(/^format\(/)) {
      return this.evaluateFormatFunction(expression, contextHits)
    }

    // Handle toJSON() function
    if (expression.match(/^toJSON\(/)) {
      return this.evaluateToJSONFunction(expression, contextHits)
    }

    // Handle fromJSON() function
    if (expression.match(/^fromJSON\(/)) {
      return this.evaluateFromJSONFunction(expression, contextHits)
    }

    // Handle join() function
    if (expression.match(/^join\(/)) {
      return this.evaluateJoinFunction(expression, contextHits)
    }

    // Handle hashFiles() function
    if (expression.match(/^hashFiles\(/)) {
      return {
        value: null,
        type: 'error',
        contextHits: [],
        error: 'hashFiles() requires workspace files (not available in this demo)'
      }
    }

    // Handle logical operations FIRST (lowest precedence)
    // This ensures comparisons are evaluated before logical operations
    if (this.containsOperatorOutsideParens(expression, '||')) {
      return this.evaluateLogicalOperation(expression, '||', contextHits)
    }
    if (this.containsOperatorOutsideParens(expression, '&&')) {
      return this.evaluateLogicalOperation(expression, '&&', contextHits)
    }

    // Handle negation
    if (expression.startsWith('!') && !expression.includes('!=')) {
      const innerExpression = expression.slice(1).trim()
      const innerResult = this.parseAndEvaluate(innerExpression)
      if (innerResult.contextHits) {
        contextHits.push(...innerResult.contextHits)
      }
      return {
        value: !this.isTruthy(innerResult.value),
        type: 'boolean',
        contextHits
      }
    }

    // Handle comparison operations (order matters - check >= before >)
    if (expression.includes('>=')) {
      return this.evaluateComparison(expression, '>=', contextHits)
    }
    if (expression.includes('<=')) {
      return this.evaluateComparison(expression, '<=', contextHits)
    }
    if (expression.includes('>')) {
      return this.evaluateComparison(expression, '>', contextHits)
    }
    if (expression.includes('<')) {
      return this.evaluateComparison(expression, '<', contextHits)
    }
    if (expression.includes('==')) {
      return this.evaluateComparison(expression, '==', contextHits)
    }
    if (expression.includes('!=')) {
      return this.evaluateComparison(expression, '!=', contextHits)
    }

    // Handle property access (e.g., github.ref, env.NODE_VERSION)
    // Only if it doesn't contain operators and isn't a function call
    if (expression.includes('.') &&
        !this.isFunction(expression) &&
        !this.hasOperators(expression)) {
      return this.evaluatePropertyAccess(expression, contextHits)
    }

    // Handle chained property access after functions (e.g., fromJSON('{}').key)
    if (expression.includes('.') &&
        this.isFunction(expression) &&
        !this.hasOperators(expression)) {
      return this.evaluateChainedPropertyAccess(expression, contextHits)
    }

    // Handle string literals
    if ((expression.startsWith("'") && expression.endsWith("'")) ||
        (expression.startsWith('"') && expression.endsWith('"'))) {
      return {
        value: expression.slice(1, -1),
        type: 'string',
        contextHits: []
      }
    }

    // Handle boolean literals
    if (expression === 'true' || expression === 'false') {
      return {
        value: expression === 'true',
        type: 'boolean',
        contextHits: []
      }
    }

    // Handle number literals
    if (/^-?\d+(\.\d+)?$/.test(expression)) {
      const value = parseFloat(expression)
      return {
        value,
        type: 'number',
        contextHits: []
      }
    }

    // Handle context root variables (github, env, vars, secrets, etc.)
    if (/^(github|env|vars|secrets|inputs|needs|runner|matrix|strategy|job|steps)$/.test(expression)) {
      const value = this.context[expression as keyof EvaluationContext]
      contextHits.push(expression)
      return {
        value,
        type: typeof value,
        contextHits
      }
    }

    throw new Error(`Unable to parse expression: ${expression}`)
  }

  private evaluatePropertyAccess(expression: string, contextHits: string[]): ExpressionResult {
    const parts = expression.split('.')
    let current: any = this.context
    let path = ''

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      path = path ? `${path}.${part}` : part

      if (current && typeof current === 'object' && part in current) {
        current = current[part]
        contextHits.push(path)
      } else {
        throw new Error(`Property '${part}' not found in context '${path}'`)
      }
    }

    return {
      value: current,
      type: typeof current,
      contextHits
    }
  }

  private evaluateComparison(expression: string, operator: '==' | '!=' | '>' | '<' | '>=' | '<=', contextHits: string[]): ExpressionResult {
    // Find the operator position to split properly
    const operatorIndex = expression.indexOf(operator)
    if (operatorIndex === -1) {
      throw new Error(`Operator ${operator} not found in expression: ${expression}`)
    }

    const leftPart = expression.substring(0, operatorIndex).trim()
    const rightPart = expression.substring(operatorIndex + operator.length).trim()

    if (!leftPart || !rightPart) {
      throw new Error(`Invalid comparison expression: ${expression}`)
    }

    const leftResult = this.parseAndEvaluate(leftPart)
    const rightResult = this.parseAndEvaluate(rightPart)

    // If either side has an error, return error
    if (leftResult.error) return leftResult
    if (rightResult.error) return rightResult

    if (leftResult.contextHits) contextHits.push(...leftResult.contextHits)
    if (rightResult.contextHits) contextHits.push(...rightResult.contextHits)

    let result: boolean
    const leftVal = leftResult.value
    const rightVal = rightResult.value

    switch (operator) {
      case '==':
        result = leftVal == rightVal
        break
      case '!=':
        result = leftVal != rightVal
        break
      case '>':
        result = Number(leftVal) > Number(rightVal)
        break
      case '<':
        result = Number(leftVal) < Number(rightVal)
        break
      case '>=':
        result = Number(leftVal) >= Number(rightVal)
        break
      case '<=':
        result = Number(leftVal) <= Number(rightVal)
        break
      default:
        throw new Error(`Unknown comparison operator: ${operator}`)
    }

    return {
      value: result,
      type: 'boolean',
      contextHits
    }
  }

  private evaluateLogicalOperation(expression: string, operator: '&&' | '||', contextHits: string[]): ExpressionResult {
    // Find the LAST operator position outside of parentheses and strings
    // This ensures we split at the lowest precedence operator
    const operatorIndex = this.findLastOperatorIndex(expression, operator)
    if (operatorIndex === -1) {
      throw new Error(`Operator ${operator} not found in expression: ${expression}`)
    }

    const leftPart = expression.substring(0, operatorIndex).trim()
    const rightPart = expression.substring(operatorIndex + operator.length).trim()

    if (!leftPart || !rightPart) {
      throw new Error(`Invalid logical expression: ${expression}`)
    }

    const leftResult = this.parseAndEvaluate(leftPart)
    if (leftResult.error) return leftResult

    if (leftResult.contextHits) contextHits.push(...leftResult.contextHits)

    if (operator === '&&') {
      // For &&: if left is falsy, return left value (short-circuit)
      if (!this.isTruthy(leftResult.value)) {
        return {
          value: leftResult.value,
          type: leftResult.type,
          contextHits
        }
      }
      // Otherwise evaluate right and return its value
    } else if (operator === '||') {
      // For ||: if left is truthy, return left value (short-circuit)
      if (this.isTruthy(leftResult.value)) {
        return {
          value: leftResult.value,
          type: leftResult.type,
          contextHits
        }
      }
      // Otherwise evaluate right and return its value
    }

    const rightResult = this.parseAndEvaluate(rightPart)
    if (rightResult.error) return rightResult

    if (rightResult.contextHits) contextHits.push(...rightResult.contextHits)

    // Return the right value (not a boolean)
    // For &&: we reach here only if left was truthy, so return right value
    // For ||: we reach here only if left was falsy, so return right value
    return {
      value: rightResult.value,
      type: rightResult.type,
      contextHits
    }
  }

  private evaluateContainsFunction(expression: string, contextHits: string[]): ExpressionResult {
    const match = expression.match(/^contains\((.+)\)$/)
    if (!match) {
      throw new Error(`Invalid contains() function: ${expression}`)
    }

    const args = this.parseArguments(match[1])
    if (args.length !== 2) {
      throw new Error(`contains() requires exactly 2 arguments, got ${args.length}`)
    }

    const searchInResult = this.parseAndEvaluate(args[0].trim())
    const searchForResult = this.parseAndEvaluate(args[1].trim())

    if (searchInResult.contextHits) contextHits.push(...searchInResult.contextHits)
    if (searchForResult.contextHits) contextHits.push(...searchForResult.contextHits)

    const searchIn = String(searchInResult.value)
    const searchFor = String(searchForResult.value)

    return {
      value: searchIn.includes(searchFor),
      type: 'boolean',
      contextHits
    }
  }

  private evaluateStringFunction(expression: string, contextHits: string[]): ExpressionResult {
    const funcMatch = expression.match(/^(startsWith|endsWith)\((.+)\)$/)
    if (!funcMatch) {
      throw new Error(`Invalid string function: ${expression}`)
    }

    const funcName = funcMatch[1]
    const args = this.parseArguments(funcMatch[2])
    if (args.length !== 2) {
      throw new Error(`${funcName}() requires exactly 2 arguments, got ${args.length}`)
    }

    const stringResult = this.parseAndEvaluate(args[0].trim())
    const searchResult = this.parseAndEvaluate(args[1].trim())

    if (stringResult.contextHits) contextHits.push(...stringResult.contextHits)
    if (searchResult.contextHits) contextHits.push(...searchResult.contextHits)

    const str = String(stringResult.value)
    const search = String(searchResult.value)

    const value = funcName === 'startsWith'
      ? str.startsWith(search)
      : str.endsWith(search)

    return {
      value,
      type: 'boolean',
      contextHits
    }
  }

  private evaluateStatusFunction(funcName: string): boolean {
    // For demo purposes, assume success() is true and others are false
    switch (funcName) {
      case 'success':
        return true
      case 'failure':
      case 'cancelled':
        return false
      case 'always':
        return true
      default:
        return false
    }
  }

  private evaluateFormatFunction(expression: string, contextHits: string[]): ExpressionResult {
    const match = expression.match(/^format\((.+)\)$/)
    if (!match) {
      throw new Error(`Invalid format() function: ${expression}`)
    }

    const args = this.parseArguments(match[1])
    if (args.length === 0) {
      throw new Error('format() requires at least one argument')
    }

    const formatResult = this.parseAndEvaluate(args[0])
    let formatString = String(formatResult.value)
    if (formatResult.contextHits) contextHits.push(...formatResult.contextHits)

    // Replace {0}, {1}, etc. with corresponding arguments
    for (let i = 1; i < args.length; i++) {
      const argResult = this.parseAndEvaluate(args[i])
      if (argResult.contextHits) contextHits.push(...argResult.contextHits)
      formatString = formatString.replace(new RegExp(`\\{${i - 1}\\}`, 'g'), String(argResult.value))
    }

    return {
      value: formatString,
      type: 'string',
      contextHits
    }
  }

  private evaluateToJSONFunction(expression: string, contextHits: string[]): ExpressionResult {
    const match = expression.match(/^toJSON\((.+)\)$/)
    if (!match) {
      throw new Error(`Invalid toJSON() function: ${expression}`)
    }

    const argResult = this.parseAndEvaluate(match[1].trim())
    if (argResult.contextHits) contextHits.push(...argResult.contextHits)

    return {
      value: JSON.stringify(argResult.value),
      type: 'string',
      contextHits
    }
  }

  private evaluateFromJSONFunction(expression: string, contextHits: string[]): ExpressionResult {
    const match = expression.match(/^fromJSON\((.+)\)$/)
    if (!match) {
      throw new Error(`Invalid fromJSON() function: ${expression}`)
    }

    const argResult = this.parseAndEvaluate(match[1].trim())
    if (argResult.contextHits) contextHits.push(...argResult.contextHits)

    try {
      const parsed = JSON.parse(String(argResult.value))
      return {
        value: parsed,
        type: typeof parsed,
        contextHits
      }
    } catch (error) {
      throw new Error(`Invalid JSON in fromJSON(): ${argResult.value}`)
    }
  }

  private evaluateJoinFunction(expression: string, contextHits: string[]): ExpressionResult {
    const match = expression.match(/^join\((.+)\)$/)
    if (!match) {
      throw new Error(`Invalid join() function: ${expression}`)
    }

    const args = this.parseArguments(match[1])
    if (args.length < 1 || args.length > 2) {
      throw new Error(`join() requires 1 or 2 arguments, got ${args.length}`)
    }

    const arrayResult = this.parseAndEvaluate(args[0].trim())
    if (arrayResult.contextHits) contextHits.push(...arrayResult.contextHits)

    // Get separator (default to comma)
    let separator = ','
    if (args.length === 2) {
      const sepResult = this.parseAndEvaluate(args[1].trim())
      if (sepResult.contextHits) contextHits.push(...sepResult.contextHits)
      separator = String(sepResult.value)
    }

    // Convert value to array if it isn't already
    let array: any[]
    if (Array.isArray(arrayResult.value)) {
      array = arrayResult.value
    } else if (arrayResult.value != null) {
      array = [arrayResult.value]
    } else {
      array = []
    }

    const result = array.map(item => String(item)).join(separator)

    return {
      value: result,
      type: 'string',
      contextHits
    }
  }

  private parseArguments(argsString: string): string[] {
    const args: string[] = []
    let current = ''
    let depth = 0
    let inString = false
    let stringChar = ''

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i]

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true
          stringChar = char
          current += char
        } else if (char === '(' || char === '[') {
          depth++
          current += char
        } else if (char === ')' || char === ']') {
          depth--
          current += char
        } else if (char === ',' && depth === 0) {
          args.push(current.trim())
          current = ''
        } else {
          current += char
        }
      } else {
        current += char
        if (char === stringChar && argsString[i - 1] !== '\\') {
          inString = false
        }
      }
    }

    if (current.trim()) {
      args.push(current.trim())
    }

    return args
  }

  private isFunction(expression: string): boolean {
    // Check if expression starts with a function name followed by parentheses
    // This should match function calls even if they have property access after them
    return /^(contains|startsWith|endsWith|format|toJSON|fromJSON|join|success|failure|always|cancelled|hashFiles)\s*\(.+\)/.test(expression.trim())
  }

  private hasOperators(expression: string): boolean {
    // Check for operators outside of quoted strings and function calls
    let inString = false
    let stringChar = ''
    let parenCount = 0

    for (let i = 0; i < expression.length - 1; i++) {
      const char = expression[i]
      const nextChar = expression[i + 1]

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true
          stringChar = char
        } else if (char === '(') {
          parenCount++
        } else if (char === ')') {
          parenCount--
        } else if (parenCount === 0) {
          // Check for operators only when not inside parentheses
          if (char === '=' && nextChar === '=') return true
          if (char === '!' && nextChar === '=') return true
          if (char === '>' && nextChar === '=') return true
          if (char === '<' && nextChar === '=') return true
          if (char === '>') return true
          if (char === '<') return true
          if (char === '&' && nextChar === '&') return true
          if (char === '|' && nextChar === '|') return true
          if (char === '!' && i > 0 && expression[i - 1] !== '=') return true
        }
      } else {
        if (char === stringChar && (i === 0 || expression[i - 1] !== '\\')) {
          inString = false
        }
      }
    }

    // Special check for single character operators at the end
    const lastChar = expression[expression.length - 1]
    if (!inString && parenCount === 0 && (lastChar === '>' || lastChar === '<')) {
      return true
    }

    return false
  }

  private evaluateChainedPropertyAccess(expression: string, contextHits: string[]): ExpressionResult {
    // Find the first dot after a closing parenthesis to split function from property access
    let parenCount = 0
    let splitIndex = -1

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i]
      if (char === '(') parenCount++
      if (char === ')') parenCount--
      if (char === '.' && parenCount === 0) {
        splitIndex = i
        break
      }
    }

    if (splitIndex === -1) {
      // No property access, just evaluate as normal
      return this.parseAndEvaluate(expression)
    }

    const functionPart = expression.substring(0, splitIndex)
    const propertyPart = expression.substring(splitIndex + 1)

    // Evaluate the function part first
    const functionResult = this.parseAndEvaluate(functionPart)
    if (functionResult.error) return functionResult

    if (functionResult.contextHits) contextHits.push(...functionResult.contextHits)

    // Now evaluate property access on the result
    const propertyPath = propertyPart.split('.')
    let current = functionResult.value
    let currentPath = 'result'

    for (const prop of propertyPath) {
      if (current && typeof current === 'object' && prop in current) {
        current = current[prop]
        currentPath += `.${prop}`
        contextHits.push(currentPath)
      } else {
        throw new Error(`Property '${prop}' not found in result`)
      }
    }

    return {
      value: current,
      type: typeof current,
      contextHits
    }
  }

  private isTruthy(value: any): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') return value !== ''
    if (typeof value === 'number') return value !== 0
    return value != null
  }

  private containsOperatorOutsideParens(expression: string, operator: '&&' | '||'): boolean {
    // Check if operator exists outside of parentheses and string literals
    let inString = false
    let stringChar = ''
    let parenCount = 0

    for (let i = 0; i < expression.length - 1; i++) {
      const char = expression[i]
      const nextChar = expression[i + 1]

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true
          stringChar = char
        } else if (char === '(') {
          parenCount++
        } else if (char === ')') {
          parenCount--
        } else if (parenCount === 0) {
          // Check for operator only when not inside parentheses
          if (operator === '&&' && char === '&' && nextChar === '&') {
            return true
          }
          if (operator === '||' && char === '|' && nextChar === '|') {
            return true
          }
        }
      } else {
        if (char === stringChar && (i === 0 || expression[i - 1] !== '\\')) {
          inString = false
        }
      }
    }

    return false
  }

  private findLastOperatorIndex(expression: string, operator: '&&' | '||'): number {
    // Find the LAST occurrence of operator outside parentheses and strings
    // This gives us the lowest precedence split point
    let inString = false
    let stringChar = ''
    let parenCount = 0
    let lastIndex = -1

    for (let i = 0; i < expression.length - 1; i++) {
      const char = expression[i]
      const nextChar = expression[i + 1]

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true
          stringChar = char
        } else if (char === '(') {
          parenCount++
        } else if (char === ')') {
          parenCount--
        } else if (parenCount === 0) {
          // Check for operator only when not inside parentheses
          if (operator === '&&' && char === '&' && nextChar === '&') {
            lastIndex = i
          }
          if (operator === '||' && char === '|' && nextChar === '|') {
            lastIndex = i
          }
        }
      } else {
        if (char === stringChar && (i === 0 || expression[i - 1] !== '\\')) {
          inString = false
        }
      }
    }

    return lastIndex
  }
}