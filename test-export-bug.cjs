const XLSX = require('xlsx');

const workbook = XLSX.readFile('/home/seth/Downloads/bob-grades.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Total students:', data.length);
console.log('First student:', data[0]);
console.log('\nAll student IDs:', data.map(r => r['Student Anonymous ID#']).slice(0, 10));

// Find students with score 51
const score51 = data.filter(row => row.Total === 51);
console.log('\nStudents with Total = 51:', score51);
