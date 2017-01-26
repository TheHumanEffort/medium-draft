import React, { PropTypes } from 'react';

import { Entity, EditorBlock } from 'draft-js';

import { getCurrentBlock, updateDataOfBlock } from '../../model/';

var ImageBlock = React.createClass({
  updateStyle: function (style) {
    const { block, blockProps } = this.props;
    const { setEditorState, getEditorState } = blockProps;

    const data = this.props.block.getData();
    const newData = data.set('style', style);

    this.props.blockProps.setEditorState(updateDataOfBlock(
      this.props.blockProps.getEditorState(), block, newData)
    );
  },

  floatLeft: function () {
    this.updateStyle('left');
  },

  floatRight: function () {
    this.updateStyle('right');
  },

  default: function () {
    this.updateStyle(null);
  },

  render() {
    var props = this.props;
    const { block, blockProps } = props;
    const { getEditorState } = blockProps;
    const data = block.getData();
    const src = data.get('src');
    const currentBlock = getCurrentBlock(getEditorState());
    const className = currentBlock.getKey() === block.getKey() ? 'md-image-is-selected' : '';

    let outerClass = 'md-block-image-outer-container';
    const style = data.get('style');
    if (style) outerClass += ' md-block-image-outer-container__' + style;

    if (src !== null) {
      return (
        <div className={outerClass}>
          <div className="md-block-image-inner-container">
            <div className="imageOperations" contentEditable="false">
              <button onClick={this.floatLeft} disabled={ this.props.block.getData().get('style') == 'left'}>Left </button>
              <button onClick={this.floatRight } disabled={ this.props.block.getData().get('style') == 'right' }>Right  </button>
              <button onClick={this.default} disabled={!this.props.block.getData().get('style')}>Big</button>
            </div>
            <img role="presentation" className={className} src={src} />
          </div>
          <figcaption>
            <EditorBlock {...props} />
          </figcaption>
        </div>
      );
    }

    return <EditorBlock {...props} />;
  },
});

ImageBlock.propTypes = {
  block: PropTypes.object,
  blockProps: PropTypes.object,
};

export default ImageBlock;
