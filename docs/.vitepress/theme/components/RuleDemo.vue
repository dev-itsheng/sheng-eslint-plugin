<template>
  <template v-if="demo">
    <div
      v-for="(example, index) in demo.examples"
      :key="`${example.filename}-${index}`"
      class="rule-demo"
    >
      <div :ref="element => setEditorHost(element, index)" class="rule-demo__editor" />
      <p v-if="loadErrors[index]" class="rule-demo__load-error">{{ loadErrors[index] }}</p>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, shallowRef, watch, type ComponentPublicInstance } from 'vue'
import { ruleDemos, type RuleDemoExample } from '../rule-demo/demos'
import { runRuleDemo, type RuleDemoProblem } from '../rule-demo/lint'

type MonacoApi = typeof import('monaco-editor/editor/editor.api')
type MonacoEditor = ReturnType<MonacoApi['editor']['create']>
type MonacoModel = ReturnType<MonacoApi['editor']['createModel']>
type EditorInstance = {
  editor: MonacoEditor
  model: MonacoModel
  lintTimer: number | undefined
}

const props = defineProps<{
  rule: string
}>()

const editorHosts: Array<HTMLDivElement | null> = []
const editorInstances: Array<EditorInstance | null> = []
const loadErrors = reactive<Record<number, string>>({})
const monacoApi = shallowRef<MonacoApi | null>(null)

const demo = computed(() => ruleDemos[props.rule])

let monacoPromise: Promise<MonacoApi> | null = null

async function loadMonaco() {
  if (!monacoPromise) {
    monacoPromise = Promise.all([
      import('monaco-editor/editor/editor.api'),
      import('monaco-editor/basic-languages/monaco.contribution'),
      import('monaco-editor/editor/contrib/hover/browser/hoverContribution'),
    ]).then(([monaco]) => monaco)
  }

  return monacoPromise
}

function getMonacoLanguage(language: string) {
  if (language === 'vue') return 'html'
  return language
}

function getEditorHeight(code: string) {
  const lineCount = code.split(/\r?\n/u).length
  return Math.max(120, 20 * (1 + lineCount))
}

function toMonacoMarkers(monaco: MonacoApi, diagnostics: RuleDemoProblem[]) {
  return diagnostics.map(problem => ({
    code: problem.ruleId,
    endColumn: problem.endColumn,
    endLineNumber: problem.endLine,
    message: problem.message,
    severity: problem.severity === 2 ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    source: 'ESLint',
    startColumn: problem.column,
    startLineNumber: problem.line,
  }))
}

function setEditorHost(element: Element | ComponentPublicInstance | null, index: number) {
  editorHosts[index] = element instanceof HTMLDivElement ? element : null
}

function runLint(index: number, example: RuleDemoExample) {
  const instance = editorInstances[index]
  const monaco = monacoApi.value
  if (!instance || !monaco) return

  const nextProblems = runRuleDemo(props.rule, instance.editor.getValue(), example)
  monaco.editor.setModelMarkers(instance.model, 'sheng-eslint-demo', toMonacoMarkers(monaco, nextProblems))
}

function queueLint(index: number, example: RuleDemoExample) {
  const instance = editorInstances[index]
  if (!instance) return

  window.clearTimeout(instance.lintTimer)
  instance.lintTimer = window.setTimeout(() => runLint(index, example), 220)
}

function disposeEditor(index: number) {
  const instance = editorInstances[index]
  if (!instance) return

  window.clearTimeout(instance.lintTimer)
  if (monacoApi.value) {
    monacoApi.value.editor.setModelMarkers(instance.model, 'sheng-eslint-demo', [])
  }
  instance.editor.dispose()
  instance.model.dispose()
  editorInstances[index] = null
}

function disposeAllEditors() {
  for (const index of editorInstances.keys()) {
    disposeEditor(index)
  }
}

async function mountExample(example: RuleDemoExample, index: number) {
  const editorHost = editorHosts[index]
  if (!editorHost) return

  loadErrors[index] = ''
  disposeEditor(index)

  try {
    const monaco = await loadMonaco()
    monacoApi.value = monaco
    await nextTick()

    const uri = monaco.Uri.parse(`file:///sheng-eslint-plugin/${props.rule}/${index}/${example.filename}`)
    const model = monaco.editor.createModel(example.code, getMonacoLanguage(example.language), uri)
    editorHost.style.height = `${getEditorHeight(example.code)}px`
    const editor = monaco.editor.create(editorHost, {
      automaticLayout: true,
      fixedOverflowWidgets: true,
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      fontSize: 13,
      hover: {
        delay: 150,
        enabled: true,
      },
      lineHeight: 22,
      minimap: { enabled: false },
      model,
      overviewRulerLanes: 0,
      renderLineHighlight: 'line',
      scrollbar: {
        alwaysConsumeMouseWheel: false,
      },
      scrollBeyondLastLine: false,
      tabSize: 2,
      theme: 'vs-dark',
      wordWrap: 'on',
    })
    editorInstances[index] = {
      editor,
      lintTimer: undefined,
      model,
    }
    editor.onDidChangeModelContent(() => queueLint(index, example))
    runLint(index, example)
  } catch (error) {
    loadErrors[index] = error instanceof Error ? error.message : '示例编辑器加载失败。'
  }
}

async function mountAllExamples() {
  const examples = demo.value?.examples ?? []
  disposeAllEditors()
  await nextTick()
  await Promise.all(examples.map((example, index) => mountExample(example, index)))
}

watch(demo, () => {
  if (typeof window !== 'undefined') {
    void mountAllExamples()
  }
})

onMounted(() => {
  void mountAllExamples()
})

onBeforeUnmount(disposeAllEditors)
</script>
