import express from 'express';
const router = express.Router();

const dataDePostagem = new Date();

import { promises as fs } from 'fs';
const { writeFile, readFile } = fs;

async function readGradesFiles() {
  const data = JSON.parse(await readFile(global.fileName))
  return data
}
//POST--------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    let grade = req.body;
    if (
      !grade.student ||
      !grade.subject ||
      !grade.type ||
      grade.value == null
    ) {
      throw new Error(
        'Nome do aluno, matéria, tipo de exame e nota são obrigatórios'
      );
    }
    const data = await readGradesFiles();
    const gradeToAdd = {
      id: data.nextId++,
      student: grade.student,
      subject: grade.subject,
      type: grade.type,
      value: grade.value,
      timestamp: dataDePostagem,
    };
    data.grades.push(gradeToAdd);

    res.send(data);

    await writeFile(global.fileName, JSON.stringify(data, null, 2));
    global.logger.info(`POST /grade - ${JSON.stringify(gradeToAdd)}`);
  } catch (err) {
    next(err);
  }
});
//------------------------------------------------------------------------------
router.get('/totalgrades/:student/:subject', async (req, res, next) => {
  try {
    const data = await readGradesFiles();
    const gatheredGrades = data.grades.filter(grade => req.params.student === grade.student
      && req.params.subject === grade.subject);
    const gradeTotal = gatheredGrades.reduce((acc, element) => {
      return acc += element.value
    }, 0);
    console.log(gradeTotal);
    res.send(`O total das notas é ${JSON.stringify(gradeTotal)}`);
  } catch (err) {
    next(err);
  }
});
//------------------------------------------------------------------------------
router.get('/studenthistory/:student', async (req, res, next) => {
  try {
    const data = await readGradesFiles();
    const gatheredGrades = data.grades.filter(grade => req.params.student === grade.student);
    console.log(gatheredGrades);
    res.send(JSON.stringify(gatheredGrades));
  } catch (err) {
    next(err);
  }
});
//------------------------------------------------------------------------------
router.get('/avaragegrades/:subject/:type', async (req, res, next) => {
  try {
    const data = await readGradesFiles();
    const gatheredGrades = data.grades.filter(grade => req.params.subject === grade.subject && req.params.type === grade.type);
    const gradeTotal = gatheredGrades.reduce((acc, element) => {
      return acc += element.value
    }, 0);
    res.send(`A média das notas é ${JSON.stringify(gradeTotal / gatheredGrades.length)}`);
  } catch (err) {
    next(err);
  }
});
//TOP 3-------------------------------------------------------------------------
router.get('/top3/:subject/:type', async (req, res, next) => {
  try {
    const data = await readGradesFiles();
    const gatheredGrades = data.grades.filter(grade =>
      req.params.subject === grade.subject && req.params.type === grade.type);
    if (!Array.isArray(gatheredGrades) || !gatheredGrades.length) {
      throw new Error('Não foram encontrados registros');
    }
    gatheredGrades.sort((a, b) => b.value - a.value)
    res.send(gatheredGrades.slice(0, 3))

  } catch (err) {
    next(err);
  }
});
//GET---------------------------------------------------------------------------
router.get('/', async (_req, res, next) => {
  try {
    const data = await readGradesFiles();
    res.send(data.grades);
    global.logger.info('GET /grade');
  } catch (err) {
    next(err);
  }
});
//GET BY ID---------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const data = await readGradesFiles();
    const grade = data.grades.find(
      (grade) => grade.id === parseInt(req.params.id)
    );
    res.send(grade);
    global.logger.info('GET /grade/:id');
  } catch (err) {
    next(err);
  }
});
//DELETE------------------------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const data = await readGradesFiles();
    data.grades = data.grades.filter(
      (grade) => grade.id !== parseInt(req.params.id)
    );

    res.send('Registro deletado com sucesso!');

    await writeFile(global.fileName, JSON.stringify(data, null, 2));
    global.logger.info(`DELETE /grade/:id - ${req.params.id}`);
  } catch (err) {
    next(err);
  }
});
//PATCH-------------------------------------------------------------------------
router.patch('/', async (req, res, next) => {
  try {
    let gradeToUpdate = req.body;
    if (
      !gradeToUpdate.id ||
      !gradeToUpdate.student ||
      !gradeToUpdate.subject ||
      !gradeToUpdate.type ||
      gradeToUpdate.value == null
    ) {
      throw new Error(
        'id, Nome do aluno, matéria, tipo de exame e nota são obrigatórios'
      );
    } else if (gradeToUpdate.value < 0 || gradeToUpdate.value > 100) {
      throw new Error('A nota deve ser entre 0 e 100');
    }
    const data = await readGradesFiles();
    const index = data.grades.findIndex(
      (grade) => grade.id === gradeToUpdate.id
    );
    if (index === -1) {
      //checks if in ID is existent
      throw new Error('Registro não encontrado');
    }
    data.grades[index] = {
      id: gradeToUpdate.id,
      student: gradeToUpdate.student,
      subject: gradeToUpdate.subject,
      type: gradeToUpdate.type,
      value: gradeToUpdate.value,
      timestamp: dataDePostagem,
    };

    await writeFile(global.fileName, JSON.stringify(data, null, 2));
    res.send(data.grades[index]);
    global.logger.info(`PATCH /grade`);
  } catch (err) {
    next(err);
  }
});
//------------------------------------------------------------------------------
router.use((err, req, res, _next) => {
  global.logger.error(`${req.method} ${req.baseUrl} - ${err.message}`);
  res.status(400).send({ error: err.message });
});
export default router;
