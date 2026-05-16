const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { Pool } = require('pg')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

app.get('/', (req, res) => {
    res.send('MedBook API running')
})
// GET all appointments
app.get('/appointments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM appointments ORDER BY id ASC')
        res.json(result.rows)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

// POST new appointment
app.post('/appointments', async (req, res) => {
    const { name, phone, service, date } = req.body
    try {
        const result = await pool.query(
            'INSERT INTO appointments (name, phone, service, date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, phone, service, date, 'pending']
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

// PATCH - confirm appointment
app.patch('/appointments/:id/confirm', async (req, res) => {
    const { id } = req.params
    try {
        const result = await pool.query(
            'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
            ['confirmed', id]
        )
        res.json(result.rows[0])
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

// DELETE - cancel appointment
app.delete('/appointments/:id', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM appointments WHERE id = $1', [id])
        res.json({ message: 'Appointment cancelled' })
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Server error' })
    }
})

const PORT = process.env.PORT || 5001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})