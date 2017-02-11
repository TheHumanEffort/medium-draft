import React, { PropTypes } from 'react';

import Immutable from 'immutable';
import { Entity, EditorBlock } from 'draft-js';

import { getCurrentBlock, updateDataOfBlock } from '../../model/';

var ImageBlock = React.createClass({
  updateStyle: function(style) {
    this.updateData({style: style});
  },

  getInitialState: function() {
    return { settingSubject: false };
  },

  updateData: function(hash) {
    const { block, blockProps } = this.props;
    const { setEditorState, getEditorState } = blockProps;

    const data = this.props.block.getData();

    const newData = data.merge(Immutable.fromJS(hash));

    this.props.blockProps.setEditorState(updateDataOfBlock(
      this.props.blockProps.getEditorState(), block, newData)
                                        );

  },

  get: function(key) {
    return this.props.block.getData().get(key);
  },

  floatLeft: function(e) {
    this.updateStyle('left');
    e.stopPropagation();
    e.preventDefault();
  },

  floatRight: function(e) {
    this.updateStyle('right');
    e.stopPropagation();
    e.preventDefault();
  },

  fullWidth: function(e) {
    this.updateStyle('full');
    e.stopPropagation();
    e.preventDefault();
  },

  default: function(e) {
    this.updateStyle(null);
    e.stopPropagation();
    e.preventDefault();
  },

  setSubject: function(e) {
    this.setState({ settingSubject: true });

    e.stopPropagation();
    e.preventDefault();
  },

  subjectClick: function(e) {
    if (this.state.settingSubject) {
      var x = e.nativeEvent.offsetX / e.currentTarget.offsetWidth;
      var y = e.nativeEvent.offsetY / e.currentTarget.offsetHeight;

      this.updateData({
        subjectX: x, subjectY: y,
      });

      this.setState({ settingFocus: false });

      e.stopPropagation();
      e.preventDefault();
    }
  },

  subjectBox: function() {
    var x = this.get('subjectX');
    var y = this.get('subjectY');
    if (!x || !y) return [];

    var style = {
      left: (Math.floor(x * 100) - 5) + '%',
      right: (Math.floor((1 - x) * 100) - 5) + '%',
      top: (Math.floor(y * 100) - 5) + '%',
      bottom: (Math.floor((1 - y) * 100) - 5) + '%',
      backgroundColor: 'rgba(255,255,255,0.4)',
      border: '1px thin blue',
      position: 'absolute',
    };

    return (
        <div className='subject-highlight' style={ style }>Subject</div>
    );
  },

  render() {
    var props = this.props;
    var m;
    const { block, blockProps } = props;
    const { getEditorState } = blockProps;
    const data = block.getData();
    var src = data.get('src');
    const currentBlock = getCurrentBlock(getEditorState());
    const className = currentBlock.getKey() === block.getKey() ? 'md-image-is-selected' : '';

    let outerClass = 'md-block-image-outer-container';
    const style = data.get('style');
    if (style) outerClass += ' md-block-image-outer-container__' + style;

    if (m = src.match(/^(https?:\/\/.*?\.imgix\.net\/.*?)\?(.*?)$/)) {
      src = m[1] + '?w=1600';
    }

    if (src !== null) {
      return (
        <div className={outerClass}>
          <div className='md-block-image-inner-container' onClick={this.subjectClick}>
            <div className='md-block-image-inner-container__operations' contentEditable='false' suppressContentEditableWarning={true}>
              <button onClick={this.floatLeft} disabled={ style == 'left'}>Left </button>
              <button onClick={this.floatRight } disabled={ style == 'right' }>Right  </button>
              <button onClick={this.fullWidth } disabled={ style == 'full' }>Wide</button>
              <button onClick={this.default} disabled={!style}>Default</button>
              <button onClick={this.setSubject}>Set Focus</button>
          </div>
          { this.subjectBox() }
            <img role='presentation' className={className} src={src} />
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
