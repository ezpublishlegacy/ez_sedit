YUI.add('sedit', function(Y){
	var L = Y.Lang,
		_attributeCache = {},
		_nodeFunctions = ['edit', 'move', 'remove', 'hide', 'sort', 'addlocations', 'pushtoblock'],
		_attributeFunctions = ['edit'],
		_nodeIcons = {},
		_nodeActions = {},
		_attributeActions = {},
		_locationHref = window.location.href,
		_isEditingAttribute = false,
		_nodeControls, _attributeControls, _currentNodeItem, _currentAttributeItem;

	_ezUrl = function(url) {
		var prefix = _config.ezRoot || '';
		if ( prefix.substr(prefix.length-1) == '/' ) {
			prefix = prefix.substr(0, prefix.length-1);
		}
		return prefix + url;
	}
		
	_nodeActions = {
		edit: function(node, atts) {
			_postRequest(_ezUrl('/content/action'), {
				ContentObjectLanguageCode: atts.lang,
				ContentNodeID: atts.nid,
				NodeID: atts.nid,
				ContentObjectID: atts.oid,
				RedirectURIAfterPublish: _locationHref,
				RedirectIfDiscarded: _locationHref,
				EditButton: true
			});
		},
		move: function(node, atts) {
			_postRequest(_ezUrl('/content/action'), {
				ContentNodeID: atts.nid,
				NodeID: atts.nid,
				RedirectURIAfterMove: _locationHref,
				RedirectIfCancel: _locationHref,
				MoveNodeButton: true
			});
		},
		hide: function(node, atts) {
			window.location.href = _ezUrl('/content/hide/' + atts.nid);
		},
		remove: function(node, atts) {
			_postRequest(_ezUrl('/content/action'), {
				ContentNodeID: atts.nid,
				NodeID: atts.nid,
				ContentObjectID: atts.oid,
				RedirectURIAfterRemove: _locationHref,
				RedirectIfCancel: _locationHref,
				ActionRemove: true
			});
		},
		sort: function(node, atts) {
			window.location.href = _ezUrl('/websitetoolbar/sort/' + atts.nid);
		},
		addlocations: function(node, atts) {
			_postRequest(_ezUrl('/content/action'), {
				ContentNodeID: atts.nid,
				NodeID: atts.nid,
				ContentObjectID: atts.oid,
				AddAssignmentButton: true
			});
		},
		pushtoblock: function(node, atts) {
			window.location.href = _ezUrl('/ezflow/push/' + atts.nid);
		},
		translate: function(node, atts) {
		}
	};

	_attributeActions = {
		edit: function(node, atts) {
			_isEditingAttribute = true;

			var edit = Y.Node.create('<div class="se-edit-att loading"></div>');
			edit.setStyle('position', 'absolute');
			edit.setStyle('z-index', '10');
			edit.setStyle('top', node.getY() + 'px');
			edit.setStyle('left', node.getX() + 'px');
			edit.setStyle('width', (node.get('offsetWidth') - 4) + 'px');
			edit.setStyle('height', (node.get('offsetHeight') - 4) + 'px');
			Y.one('body').append(edit);
			_attributeUISetInvisible(node);
			node.setStyle('opacity', '0.5');

			Y.io(_ezUrl('/layout/set/sedit/content/action'), {
				method: 'POST',
				data: {
					sEditAttributeAction: true,
					AttributeId: atts.aid,
					ContentClassAttributeId: atts.ccaid,
					ContentObjectID: atts.oid,
					ContentObjectLanguageCode: atts.lang,
					RedirectURIAfterPublish: _locationHref,
					RedirectIfDiscarded: _locationHref,
				},
				on : {
					success: function(id, o) {
						node.setStyle('visibility', 'hidden');
						
						var content = Y.Node.create('<div class="content">' + o.responseText + '</div>');
							  input = content.one('.ezcca-edit-datatype-ezstring input[type=text]'),
								textarea = null;
						if ( !!input ) {
							textarea = Y.Node.create('<textarea></textarea>');
							textarea.setAttribute('name', input.getAttribute('name'));
							textarea.set('innerHTML', input.getAttribute('value'));
							textarea.setStyle('height', node.get('offsetHeight') + 'px');
							textarea.setStyle('fontStyle', node.getComputedStyle('fontStyle'));
							textarea.setStyle('fontWeight', node.getComputedStyle('fontWeight'));
							textarea.setStyle('fontFamily', node.getComputedStyle('fontFamily'));
							textarea.setStyle('fontSize', node.getComputedStyle('fontSize'));
							textarea.setStyle('lineHeight', node.getComputedStyle('lineHeight'));
							textarea.setStyle('color', node.getComputedStyle('color'));
							input.replace(textarea);
						}

						//content.setStyle('visibility', 'hidden');
				    edit.append(content);

						var anim = new Y.Anim({
				        node: edit,
				        duration: 0.5,
				        to: { 
					        height: content.get('offsetHeight'),
					        width: content.get('offsetWidth')
					      }
				    });

				    function finish() {
							edit.removeClass('loading');
							if ( !textarea ) {
								edit.setStyle('width', 'auto');
								edit.setStyle('height', 'auto');
							}
							content.setStyle('visibility', 'visible');

					    var firstInput = content.one('input, textarea');
					    if ( firstInput ) {
					    	firstInput.focus();
					    }
				    }
				 
				    anim.on('end', finish);

						edit.one('#seditAttributePublish').on('click', function(e) {
							if ( !!textarea ) {
								textarea.set('innerHTML', textarea.get('innerHTML').split("\n").join(' '));
							}
							edit.addClass('loading');
						});
						edit.one('#seditAttributeDiscard').on('click', function(e) {
							node.setStyle('opacity', '1');
							node.setStyle('visibility', 'visible');
							edit.setStyle('display', 'none');
							var form = edit.one('form');
							form.one('#seditAttributePublish').remove();
							Y.io(form.getAttribute('action'), {
								method: 'POST',
								form: {
									id:form.get('id')
								}
							});
							edit.remove();
							_isEditingAttribute = false;
						});

						if ( !textarea ) {
							anim.run();
						} else {
							finish();
						}
					},
					failure: function(e) {
						_isEditingAttribute = false;
						node.setStyle('opacity', '1');
						node.setStyle('visibility', 'visible');
						edit.remove();
					}
				}
			});
		}
	};

	function _postRequest(url, params) {
		var form = document.createElement("form");
    form.setAttribute("method", 'post');
    form.setAttribute("action", url);

    for(var key in params) {
        var hiddenField = document.createElement("input");
        hiddenField.setAttribute("type", "hidden");
        hiddenField.setAttribute("name", key);
        hiddenField.setAttribute("value", params[key]);

        form.appendChild(hiddenField);
    }

    document.body.appendChild(form);
    form.submit();
	}
	
	// 
	function _parseNode(node) {
		var classNames = node.getAttribute('className').split(' '),
			attributes = {},
			i, nameValue, name, value, l = classNames.length;
		
		// already been parsed - return cached attributes
		if ( !!_attributeCache[node._yuid] )
			return _attributeCache[node._yuid];
		
		for ( i=0; i<l; i++ ) {
			if ( classNames[i].indexOf('se-') === 0 ) {
				nameValue = classNames[i].substring(3);
				if ( nameValue.indexOf('-') > 0 ) {
					name = nameValue.substring(0, nameValue.indexOf('-'));
					value = nameValue.substring(nameValue.indexOf('-')+1);
					attributes[name] = value;
				} else {
					attributes[nameValue] = true;
				}
			}
		}
		
		for ( i=0, l=_nodeFunctions.length; i<l; i++ ) {
			attributes[_nodeFunctions[i]] = _canDo(_nodeFunctions[i], attributes);
		}
		_attributeCache[node._yuid] = attributes;
		return attributes;
	}
	
	function _contains(arr, value) {
		var i, l=arr.length;
		for ( i=0; i<l; i++) {
			if ( arr[i] == value ) {
				return true;
			}
		}
		return false;
	}
	
	function _containsStartOf(arr, value) {
		var i, l=arr.length;
		for ( i=0; i<l; i++) {
			if ( value.indexOf(arr[i]) === 0 ) {
				return true;
			}
		}
		return false;
	}
	
	function _canDoAll_nodeFunctions() {
		if ( _config.policies == '*' ) {
			return true;
		}
		
		return false;
	}
	
	function _canDoAll(funcName) {
		if ( _canDoAll_nodeFunctions() ) {
			return true;
		}
		
		if ( !L.isObject(_config.policies) ) {
			return false;
		}
		
		var policy = _config.policies[funcName];
		
		if ( policy == '*' ) {
			return true;
		}
		
		return false;
	}
	
	function _canDo(funcName, node) {
		if ( _canDoAll(funcName) ) {
			return true;
		}

		if ( funcName == 'sort' ) {
			return _canDo('edit', node);
		}
		
		var policy = _config.policies[funcName];
		
		if ( !L.isObject(policy) ) {
			return false;
		}

		if ( !L.isUndefined(policy.Node) && L.isArray(policy.Node) ) {
			if ( !_contains(policy.Node, node.nid) ) {
				return false;
			}
		}
		
		if ( !L.isUndefined(policy.Class) && L.isArray(policy.Class) ) {
			if ( !_contains(policy.Class, node.cid) ) {
				return false;
			}
		}
		
		if ( !L.isUndefined(policy.Section) && L.isArray(policy.Section) ) {
			if ( !_contains(policy.Section, node.sid) ) {
				return false;
			}
		}
		
		if ( !L.isUndefined(policy.Subtree) && L.isArray(policy.Subtree) ) {
			if ( !_containsStartOf(policy.Subtree, '/' + node.stid.split('-').join('/')) ) {
				return false;
			}
		}
		
		if ( !L.isUndefined(policy.Language) && L.isArray(policy.Language) ) {
			if ( !_contains(policy.Language, node.lang) ) {
				return false;
			}
		}
		
		if ( !L.isUndefined(policy.Owner) && ( policy.Owner == '1' || policy.Owner == '2' ) ) {
			if ( node.owid != _config.userId ) {
				return false;
			}
		}

		// TODO: Test for Group: Self, self and current session
		
		
		return true;
	}
	
	// returns true if the user can do at least one of the available content functions on a node
	function _canDoOne(node) {
		for ( i=0, l=_nodeFunctions.length; i<l; i++ ) {
			if ( node[_nodeFunctions[i]] == true ) {
				return true;
			}
		}
		return false;
	}

	
	function _nodeUISetVisible(node) {
		var attributes = _parseNode(node),
				forceOff, forceOn, ancestor;

		if ( _isEditingAttribute || !_canDoOne(attributes) ) {
			return false;
		}
		
		for ( i=0, l=_nodeFunctions.length; i<l; i++ ) {
			forceOff = false;
			ancestor = node.get('parentNode');

			// Don't show hide icon if we're inside an ezflow block.
			// Hiding it won't remove it from the block + will confuse the user.
			if ( _nodeFunctions[i] == 'hide' ) {
				while ( ancestor.get('nodeName') != 'BODY' ) {
					if ( ancestor.get('id') && ancestor.get('id').indexOf('address-') === 0 ) {
						forceOff = true;
						break;
					}
					ancestor = ancestor.get('parentNode');
				}
			} else if ( _nodeFunctions[i] == 'pushtoblock' ) {
				forceOn = true;
			}
			if ( forceOn ||
					(!forceOff && attributes[_nodeFunctions[i]] && ( _nodeFunctions[i] != 'sort' || !!attributes['con'] ) ) ) {
				_nodeIcons[_nodeFunctions[i]].addClass('on');
			} else {
				_nodeIcons[_nodeFunctions[i]].removeClass('on');
			}
		}

		if ( !!_currentNodeItem ) {
			_nodeUISetInvisible(_currentNodeItem);
		}

		node.append(_nodeControls);
		node.addClass('on');
		_nodeControls.addClass('on');

		_currentNodeItem = node;
	}
	
	function _nodeUISetInvisible(node) {
		_nodeControls.removeClass('on');
		node.removeClass('on');

		var attributes = _parseNode(node);
		//console.info('Node invisible: ' + attributes.oid);
		_currentNodeItem = null;
	}


	function _attributeUISetVisible(node) {
		var attributes = _parseNode(node);

		//console.info('Att visible: ' + attributes.oid);

		if ( _isEditingAttribute || !_canDo('edit', attributes) ) {
			return false;
		}

		if ( !!_currentAttributeItem ) {
			_attributeUISetInvisible(_currentAttributeItem);
		}

		node.append(_attributeControls);
		node.addClass('on');
		_attributeControls.addClass('on');

		_currentAttributeItem = node;

		if ( !node.hasClass('se-node') && attributes.nid != _config.currentNodeId ) {
			if ( !node.ancestor('.se-node.se-oid-' + attributes.oid) ) {
				node.addClass('se-node');
				_nodeUISetVisible(node);
			}
		}
	}
	
	function _attributeUISetInvisible(node) {
		_attributeControls.removeClass('on');
		node.removeClass('on');

		_currentAttributeItem = null;

		var attributes = _parseNode(node);

		//console.info('Att invisible: ' + attributes.oid);
		/*if ( !node.ancestor('.se-node.se-oid-' + attributes.oid) ) {
			_nodeUISetInvisible(node);
		}*/
	}
	
	function _initUI() {
		var icon;

		if ( _config.enableNodeFunctions ) {
			_nodeControls = Y.Node.create('<div class="se-node-controls"></div>');
			
			for ( i=0, l=_nodeFunctions.length; i<l; i++ ) {
				icon = Y.Node.create('<a href="#" class="se-icon se-' + _nodeFunctions[i] + '" title="' + Y.sEdit.I18N['node_' + _nodeFunctions[i]] + '">' + Y.sEdit.I18N['node_' + _nodeFunctions[i]] + '</a>');
				_nodeControls.append(icon);
				icon.setData('funcName', _nodeFunctions[i]);
				Y.on('click', function(e){
					_nodeActions[e.target.getData('funcName')](_currentNodeItem, _parseNode(_currentNodeItem));
					e.preventDefault();
				}, icon);
				icon.setData('funcName', _nodeFunctions[i]);
				_nodeIcons[_nodeFunctions[i]] = icon;
			}

			Y.get('body').append(_nodeControls);

			Y.delegate('mouseenter', function(e) {
				_nodeUISetVisible(e.currentTarget);
			}, 'body', '.se-node');
			
			Y.delegate('mouseleave', function(e) {
				_nodeUISetInvisible(e.currentTarget);
			}, 'body', '.se-node');
		}

		if ( _config.enableAttributeFunctions ) {
			_attributeControls = Y.Node.create('<div class="se-attribute-controls"></div>');
			
			for ( i=0, l=_attributeFunctions.length; i<l; i++ ) {
				icon = Y.Node.create('<a href="#" class="se-icon on se-' + _attributeFunctions[i] + '" title="' + Y.sEdit.I18N['attribute_' + _attributeFunctions[i]] + '">' + Y.sEdit.I18N['attribute_' + _attributeFunctions[i]] + '</a>');
				_attributeControls.append(icon);
				icon.setData('funcName', _attributeFunctions[i]);
				Y.on('click', function(e){
					_attributeActions[e.target.getData('funcName')](_currentAttributeItem, _parseNode(_currentAttributeItem));
					e.preventDefault();
				}, icon);
				icon.setData('funcName', _attributeFunctions[i]);
			}

			Y.get('body').append(_attributeControls);

			Y.delegate('mouseenter', function(e) {
				_attributeUISetVisible(e.currentTarget);
				e.stopPropagation();
			}, 'body', '.se-attribute');
			
			Y.delegate('mouseleave', function(e) {
				_attributeUISetInvisible(e.currentTarget);
				e.stopPropagation();
			}, 'body', '.se-attribute');
		}
	}
	
	function _init(config) {
		_config = config;
		_initUI();
	}
	
	Y.sEdit = {
		I18N: {},
		init: _init
	}


}, '1', {requires: ['node', 'event', 'dom', 'io-form', 'querystring-stringify-simple', 'anim']});