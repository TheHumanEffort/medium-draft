/* eslint-disable */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import {
  EditorState,
  convertToRaw,
  convertFromRaw,
  KeyBindingUtil,
  Modifier,
  AtomicBlockUtils,
  Entity,
} from 'draft-js';

import 'draft-js/dist/Draft.css';
import 'hint.css/hint.min.css';

import './index.scss';
import './components/addbutton.scss';
import './components/toolbar.scss';
import './components/blocks/text.scss';
import './components/blocks/atomic.scss';
import './components/blocks/blockquotecaption.scss';
import './components/blocks/caption.scss';
import './components/blocks/todo.scss';
import './components/blocks/image.scss';

import {
  Editor,
  StringToTypeMap,
  Block,
  keyBindingFn,
  createEditorState,
  addNewBlock,
  addNewBlockAt,
  beforeInput,
  getCurrentBlock,
  ImageSideButton,
  rendererFn,
  HANDLED,
  NOT_HANDLED
} from './index';

import {
  setRenderOptions,
  blockToHTML,
  entityToHTML,
  styleToHTML,
} from './exporter';

const newTypeMap = StringToTypeMap;
newTypeMap['2.'] = Block.OL;

const { hasCommandModifier } = KeyBindingUtil;

/*
A demo for example editor. (Feature not built into medium-draft as too specific.)
Convert quotes to curly quotes.
*/
const DQUOTE_START = '“';
const DQUOTE_END = '”';
const SQUOTE_START = '‘';
const SQUOTE_END = '’';

const newBlockToHTML = (block) => {
  const blockType = block.type;
  if (block.type === Block.ATOMIC) {
    if (block.text === 'E') {
      return {
        start: '<figure class="md-block-atomic md-block-atomic-embed">',
        end: '</figure>',
      };
    } else if (block.text === '-') {
      return <div className='md-block-atomic md-block-atomic-break'><hr/></div>;
    }
  }

  return blockToHTML(block);
};

const newEntityToHTML = (entity, originalText) => {
  if (entity.type === 'embed') {
    return (
      <div>
        <a
          className='embedly-card'
          href={entity.data.url}
          data-card-controls='0'
          data-card-theme='dark'
        >Embedded ― {entity.data.url}
        </a>
      </div>
    );
  }

  return entityToHTML(entity, originalText);
};

const handleBeforeInput = (editorState, str, onChange) => {
  if (str === '"' || str === '\'') {
    const currentBlock = getCurrentBlock(editorState);
    const selectionState = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    const text = currentBlock.getText();
    const len = text.length;
    if (selectionState.getAnchorOffset() === 0) {
      onChange(EditorState.push(editorState, Modifier.insertText(contentState, selectionState, (str === '"' ? DQUOTE_START : SQUOTE_START)), 'transpose-characters'));
      return HANDLED;
    } else if (len > 0) {
      const lastChar = text[len - 1];
      if (lastChar !== ' ') {
        onChange(EditorState.push(editorState, Modifier.insertText(contentState, selectionState, (str === '"' ? DQUOTE_END : SQUOTE_END)), 'transpose-characters'));
      } else {
        onChange(EditorState.push(editorState, Modifier.insertText(contentState, selectionState, (str === '"' ? DQUOTE_START : SQUOTE_START)), 'transpose-characters'));
      }

      return HANDLED;
    }
  }

  return beforeInput(editorState, str, onChange, newTypeMap);
};

class SeparatorSideButton extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    const entityKey = Entity.create('separator', 'IMMUTABLE', {});
    this.props.setEditorState(
      AtomicBlockUtils.insertAtomicBlock(
        this.props.getEditorState(),
        entityKey,
        '-'
      )
    );
    this.props.close();
  }

  render() {
    return (
      <button
        className='md-sb-button md-sb-img-button'
        type='button'
        title='Add a separator'
        onClick={this.onClick}
      >
        <i className='fa fa-minus' />
      </button>
    );
  }
}

class EmbedSideButton extends React.Component {

  static propTypes = {
    setEditorState: React.PropTypes.func,
    getEditorState: React.PropTypes.func,
    close: React.PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
    this.addEmbedURL = this.addEmbedURL.bind(this);
  }

  onClick() {
    const url = window.prompt('Enter a URL', 'https://www.youtube.com/watch?v=5nk2HGj3vqY');
    this.props.close();
    if (!url) {
      return;
    }

    this.addEmbedURL(url);
  }

  addEmbedURL(url) {
    const entityKey = Entity.create('embed', 'IMMUTABLE', {url});
    this.props.setEditorState(
      AtomicBlockUtils.insertAtomicBlock(
        this.props.getEditorState(),
        entityKey,
        'E'
      )
    );
  }

  render() {
    return (
      <button
        className='md-sb-button md-sb-img-button'
        type='button'
        title='Add an Embed'
        onClick={this.onClick}
      >
        <i className='fa fa-code' />
      </button>
    );
  }

}

class AtomicEmbedComponent extends React.Component {

  static propTypes = {
    data: React.PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      showIframe: false,
    };

    this.enablePreview = this.enablePreview.bind(this);
  }

  componentDidMount() {
    this.renderEmbedly();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.showIframe !== this.state.showIframe && this.state.showIframe === true) {
      this.renderEmbedly();
    }
  }

  getScript() {
    const script = document.createElement('script');
    script.async = 1;
    script.src = '//cdn.embedly.com/widgets/platform.js';
    script.onload = () => {
      window.embedly();
    };

    document.body.appendChild(script);
  }

  renderEmbedly() {
    if (window.embedly) {
      window.embedly();
    } else {
      this.getScript();
    }
  }

  enablePreview() {
    this.setState({
      showIframe: true,
    });
  }

  render() {
    const { url } = this.props.data;
    const innerHTML = `<div><a class="embedly-card" href="${url}" data-card-controls="0" data-card-theme="dark">Embedded ― ${url}</a></div>`;
    return (
      <div className='md-block-atomic-embed'>
        <div dangerouslySetInnerHTML={{ __html: innerHTML }} />
      </div>
    );
  }
}

const AtomicSeparatorComponent = (props) => (
  <hr />
);

const AtomicBlock = (props) => {
  const { blockProps, block } = props;
  const entity = Entity.get(block.getEntityAt(0));
  const data = entity.getData();
  const type = entity.getType();
  if (blockProps.components[type]) {
    const AtComponent = blockProps.components[type];
    return (
      <div className={`md-block-atomic-wrapper md-block-atomic-wrapper-${type}`}>
        <AtComponent data={data} />
      </div>
    );
  }

  return <p>Block of type <b>{type}</b> is not supported.</p>;
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editorState: createEditorState(),
      editorEnabled: true,
      placeholder: 'Write here...',
    };

    this.onChange = (editorState, callback = null) => {
      if (this.state.editorEnabled) {
        this.setState({ editorState }, () => {
          if (callback) {
            callback();
          }
        });
      }

      var currentContent = editorState.getCurrentContent();
      var changeCallback = this.props.onChange;

      clearTimeout(this._debouncedOnChange);

      this._debouncedOnChange = setTimeout(function() {
        changeCallback(convertToRaw(currentContent));
      }, this.props.debounce || 200);
    };

    this.getEditorState = () => this.state.editorState;

    this.renderHTML = this.renderHTML.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.keyBinding = this.keyBinding.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.handleDroppedFiles = this.handleDroppedFiles.bind(this);
    this.handleReturn = this.handleReturn.bind(this);
  }

  componentDidMount() {
    this.setState({
      editorState: createEditorState(this.props.initialState),
      placeholder: 'Write here...',
    }, () => {
      this._editor.focus();
    });
  }

  rendererFn(setEditorState, getEditorState) {
    const atomicRenderers = {
      embed: AtomicEmbedComponent,
      separator: AtomicSeparatorComponent,
    };
    const rFnOld = rendererFn(setEditorState, getEditorState);
    const rFnNew = (contentBlock) => {
      const type = contentBlock.getType();
      switch (type) {
        case Block.ATOMIC:
          return {
            component: AtomicBlock,
            editable: false,
            props: {
              components: atomicRenderers,
            },
          };
        default: return rFnOld(contentBlock);
      }
    };

    return rFnNew;
  }

  keyBinding(e) {
    if (hasCommandModifier(e)) {
      if (e.which === 83) {  /* Key S */
        return 'editor-save';
      }

      // else if (e.which === 74 /* Key J */) {
      //  return 'do-nothing';
      //}
    }

    if (e.altKey === true) {
      if (e.shiftKey === true) {
        switch (e.which) {
          /* Alt + Shift + L */
          case 76: return 'load-saved-data';
          /* Key E */

          // case 69: return 'toggle-edit-mode';
        }
      }

      if (e.which === 72 /* Key H */) {
        return 'toggleinline:HIGHLIGHT';
      }
    }

    return keyBindingFn(e);
  }

  handleKeyCommand(command) {
    if (command === 'editor-save') {
      window.localStorage['editor'] = JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent()));
      return true;
    } else if (command === 'load-saved-data') {
      this.loadSavedData();
      return true;
    } else if (command === 'toggle-edit-mode') {
      this.toggleEdit();
    }

    return false;
  }

  load() {
    this.setState({
      placeholder: 'Loading...',
    });
    const req = new XMLHttpRequest();
    req.open('GET', 'data.json', true);
    req.onreadystatechange = () => {
      if (req.readyState === 4) {
        const data = JSON.parse(req.responseText);
        this.setState({
          editorState: createEditorState(data),
          placeholder: 'Write here...',
        }, () => {
          this._editor.focus();
        });
      }
    };

    req.send();
  }

  logData(e) {
    const currentContent = this.state.editorState.getCurrentContent();
    const es = convertToRaw(currentContent);
    console.log(es);
    console.log(this.state.editorState.getSelection().toJS());
  }

  renderHTML(e) {
    const currentContent = this.state.editorState.getCurrentContent();
    const eHTML = this.exporter(currentContent);
    var newWin = window.open(
      `${window.location.pathname}rendered.html`,
      'windowName', `height=${window.screen.height},width=${window.screen.wdith}`);
    newWin.onload = () => newWin.postMessage(eHTML, window.location.origin);
  }

  toggleEdit(e) {
    this.setState({
      editorEnabled: !this.state.editorEnabled,
    }, () => {
    });
  }

  handleDroppedFiles(selection, files) {
    const file = files[0];
    if (file.type.indexOf('image/') === 0) {
      // eslint-disable-next-line no-undef
      const src = URL.createObjectURL(file);
      this.onChange(addNewBlockAt(
        this.state.editorState,
        selection.getAnchorKey(),
        Block.IMAGE, {
          src,
        }
      ));
      return HANDLED;
    }

    return NOT_HANDLED;
  }

  handleReturn(e) {
    // const currentBlock = getCurrentBlock(this.state.editorState);
    // var text = currentBlock.getText();
    return NOT_HANDLED;
  }

  render() {
    const { editorState, editorEnabled } = this.state;
    return (
      <div>
        <Editor
          ref={(e) => {this._editor = e;}}

          editorState={editorState}
          onChange={this.onChange}
          editorEnabled={editorEnabled}
          handleDroppedFiles={this.handleDroppedFiles}
          handleKeyCommand={this.handleKeyCommand}
          placeholder={this.state.placeholder}
          keyBindingFn={this.keyBinding}
          beforeInput={handleBeforeInput}
      handleReturn={this.handleReturn}
      sideButtons={this.props.sideButtons}
      rendererFn={this.rendererFn}
        />
        </div>
    );
  }
};

function externalToInternalSideButton(hash) {
  if (hash.type) {
    if (hash.type == 'embed') {
      return { title: 'Embed', component: EmbedSideButton };
    }
  } else {
    var component = React.createClass({
      // API for the callback:
      BLOCK_TYPES: Block,

      done() {
        this.props.close();
      },

      insertBlock(type, hash) {
        this.props.setEditorState(addNewBlock(
          this.props.getEditorState(),
          type, hash
        ));
      },

      insertAtomicBlock(key, text) {
        this.props.setEditorState(
          AtomicBlockUtils.insertAtomicBlock(
            this.props.getEditorState(),
            key,
            text
          )
        );
      },

      onClick() {
        hash.callback(this);
      },

      render() {
        return (
            <button className='md-sb-button md-sb-img-button' type='button'
          onClick={this.onClick}
          title={hash.label}>
            <i className={`fa fa-${ hash.icon }`}/>
            </button>
        );
      },
    });

    const propTypes = {
      setEditorState: PropTypes.func,
      getEditorState: PropTypes.func,
      close: PropTypes.func,
    };

    component.prototype.createEntity = Entity.create.bind(Entity);
    component.propTypes = propTypes;

    return { title: hash.name, component };
  }
}

export default function MediumDraft(element, field, options) {
  let initialState;

  try {
    if (field.value.length) {
      initialState = JSON.parse(field.value);
    }
  } catch (x) {

  }

  function change(rawState) {
    field.value = JSON.stringify(rawState);
  }

  let sideButtons = [];
  if (options.sideButtons) {
    sideButtons = options.sideButtons.map(externalToInternalSideButton);
  }

  return ReactDOM.render(
    <App onChange={change} debounce={200} sideButtons={ sideButtons } initialState={initialState}/>,
    element
  );
}
