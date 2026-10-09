const todos = [{text: 'A', archived: true}, {text: 'B'}]; function applyFilters(arr) { return arr.filter(t => { if (t.archived) return false; return true; }); } console.log(applyFilters(todos));
