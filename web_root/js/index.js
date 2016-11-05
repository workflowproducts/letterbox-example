var list = document.querySelector('.todo-list');
var new_todo = document.querySelector('.new-todo');

function ajaxPOST(url, data, callback) {
	var ajax = new XMLHttpRequest();

	ajax.onreadystatechange = function () {
		if (ajax.readyState === XMLHttpRequest.DONE) {
			if (ajax.status === 200) {
				callback(ajax.status, JSON.parse(ajax.responseText));
			} else {
				callback(ajax.status, ajax.responseText);
			}
		}
	}

	ajax.open('POST', url, true);
	ajax.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	ajax.send(data);

	return ajax;
}

function loadData() {
	Array.prototype.slice.call(document.querySelectorAll('ul.filters > li > a')).map(function (a) {
		if (a.getAttribute('href') === location.hash) {
			a.classList.add('selected');
		} else {
			a.classList.remove('selected');
		}
		return a;
	});
	
	ajaxPOST('/env/action_select', 'src=todo.ttodo&order_by=id%20DESC&where=' +
			encodeURIComponent(
				location.hash === '#/active' 	? 'complete = 0' :
				location.hash === '#/completed'	? 'complete = -1' : 'TRUE'
			), function (responseCode, data) {
		if (responseCode != 200) {
			throw responseCode + ' ' + data;
		}

		while (list.firstChild) {
			list.removeChild(list.firstChild);
		}

		var i = 0, len = data.dat.row_count;
		console.log(data);
		for (; i < len; i += 1) {
			// data.dat.arr_column: ["id", "task", "complete"]
			var li = document.createElement('li');
			var div = document.createElement('div');
			var input = document.createElement('input');
			var label = document.createElement('label');
			var button = document.createElement('button');

			input.type = 'checkbox';
			input.classList.add('toggle');
			input.checked = data.dat.dat[i][2] === -1;
			input.id = data.dat.dat[i][0];
			input.addEventListener('change', taskToggle);
			div.appendChild(input);

			label.innerText = data.dat.dat[i][1];
			label.addEventListener('dblclick', taskEdit);
			div.appendChild(label);

			button.classList.add('destroy');
			button.id = data.dat.dat[i][0];
			button.addEventListener('click', taskDelete);
			div.appendChild(button);

			div.classList.add('view');
			li.appendChild(div);

			li.label = label;
			label.li = li;
			li.id = data.dat.dat[i][0];
			if (data.dat.dat[i][2] === -1) {
				li.classList.add('completed');
			}

			list.appendChild(li);
		}
		updateCount();
	});
}

function updateCount() {
	if (list.childElementCount === 0) {
		document.querySelector('.footer').style.display = 'none';
	} else {
		ajaxPOST('/env/action_select', 'src=(' + encodeURIComponent('SELECT count(*) AS total, sum(CASE WHEN complete = -1 THEN 1 ELSE 0 END) AS completed FROM todo.ttodo') + ') em', function (responseCode, data) {
			if (responseCode != 200) {
				throw responseCode + ' ' + data;
			}
			// data.dat.arr_column: ["total", "completed"]

			var total = data.dat.dat[0][0];
			var completed = data.dat.dat[0][1];
			var active = total - completed;

			document.querySelector('.toggle-all').checked = (total === completed);
			document.querySelector('.footer').style.display = 'block';
			document.querySelector('.todo-count').innerHTML =
				'<strong>' + active + '</strong> item' +
				(active === 1 ? '' : 's') + ' left';
		});
	}
}

function taskChange() {
	var self = this.parentNode,
		newValue = this.value,
		rowID = self.id;
	console.log(self, rowID, newValue);
	ajaxPOST('/env/action_update', 'src=todo.ttodo&column=task&value=' + encodeURIComponent(newValue) +
			'&where=' + encodeURIComponent('id=' + rowID), function (responseCode, data) {
		if (responseCode != 200) {
			throw responseCode + ' ' + data;
		}
	});
}

function taskEdit(_event) {
	var self = this,
		input = document.createElement('input');
	console.log('test');
	self.li.classList.add('editing');

	input.classList.add('edit');
	input.value = this.innerText;

	function blurHandler(event) {
		input.removeEventListener('blur', _self);
		self.innerText = input.value;
		taskChange.apply(input, []);
		self.li.classList.remove('editing');
		self.li.removeChild(input);
	}
	input.addEventListener('blur', blurHandler);
	input.addEventListener('keyup', function (event) {
		if (event.keyCode === 13) {
			input.removeEventListener('blur', blurHandler);

			self.innerText = input.value;
			taskChange.apply(input, []);
			self.li.classList.remove('editing');
			self.li.removeChild(input);
		} else if (event.keyCode === 27) { // esc
			input.removeEventListener('blur', blurHandler);

			self.li.classList.remove('editing');
			self.li.removeChild(input);
		}
		console.log(event.keyCode);
	});
	self.li.appendChild(input);
	input.focus();
}

function taskDelete(event) {
	var rowID = this.id, self = this;
	ajaxPOST('/env/action_delete', 'src=todo.ttodo&id=' + rowID, function (responseCode, data) {
		if (responseCode != 200) {
			throw responseCode + ' ' + data;
		}

		self.parentNode.parentNode.parentNode.removeChild(self.parentNode.parentNode);
		updateCount();
	});
}

function taskToggle(event) {
	var rowID = this.id, self = this;
	ajaxPOST('/env/action_update', 'src=todo.ttodo&column=complete&value=' + (this.checked ? '-1' : '0') +
			'&where=' + encodeURIComponent('id=' + rowID), function (responseCode, data) {
		if (responseCode != 200) {
			throw responseCode + ' ' + data;
		}

		self.parentNode.parentNode.classList.toggle('completed');
		self.classList.toggle('unchecked');
		self.classList.toggle('checked');
		updateCount();
	});
}

window.addEventListener('hashchange', function () {
	loadData();
});

ajaxPOST('/env/auth', 'action=login&username=main_user&password=password', function (responseCode, data) {
	if (responseCode != 200) {
		throw responseCode + ' ' + data;
	}

	console.log('connected');

	loadData();

	document.querySelector('.toggle-all').addEventListener('change', function () {
		var newValue = (this.checked ? -1 : 0).toString();
		ajaxPOST('/env/todo.action_toggle_all', newValue, function (responseCode, data) {
			if (responseCode != 200) {
				throw responseCode + ' ' + data;
			}

			loadData();
		});
	});

	document.querySelector('.clear-completed').addEventListener('click', function () {
		var rowIDs = Array.prototype.slice.call(document.querySelectorAll('li.completed')).map(function (a) {
			return a.id.toString();
		}).join(',');
		ajaxPOST('/env/action_delete', 'src=todo.ttodo&id=' + rowIDs, function (responseCode, data) {
			if (responseCode != 200) {
				throw responseCode + ' ' + data;
			}

			loadData();
		});
	});

	new_todo.addEventListener('keypress', function (event) {
		if (event.keyCode === 13) {
			ajaxPOST('/env/action_insert', 'src=todo.ttodo&data=' + encodeURIComponent('task=' + encodeURIComponent(new_todo.value)), function (responseCode, data) {
				if (responseCode != 200) {
					throw responseCode + ' ' + data;
				}
				// data.dat.arr_column: ["id", "task", "complete"]

				var li = document.createElement('li');
				var div = document.createElement('div');
				var input = document.createElement('input');
				var label = document.createElement('label');
				var button = document.createElement('button');

				input.type = 'checkbox';
				input.classList.add('toggle');
				input.checked = false;
				input.id = data.dat.lastval;
				input.addEventListener('change', taskToggle);
				div.appendChild(input);

				label.innerText = new_todo.value;
				label.addEventListener('dblclick', taskEdit);
				div.appendChild(label);

				button.classList.add('destroy');
				button.id = data.dat.lastval;
				button.addEventListener('click', taskDelete);
				div.appendChild(button);

				div.classList.add('view');
				li.appendChild(div);

				li.label = label;
				label.li = li;
				li.id = data.dat.lastval;

				list.appendChild(li);
				list.insertBefore(li, list.firstChild);
				new_todo.value = '';
				new_todo.focus();

				updateCount();
			});
		}
	});
});

window.onunload = function () {
	postgresClose(function (err) {
		if (err) {
			throw err;
		}

		console.log('close');
	});
};
