#!/usr/bin/env python

import tempfile
import vtk

def SerializeVTKTable(table):
  writer = vtk.vtkTableWriter()
  writer.SetWriteToOutputString(1)
  writer.SetInputData(table)
  writer.Update()
  return writer.GetOutputString()

def DeserializeVTKTable(tableString):
  reader = vtk.vtkTableReader()
  reader.ReadFromInputStringOn()
  reader.SetInputString(tableString)
  reader.Update()
  return reader.GetOutput()

def SerializeVTKTree(tree):
  writer = vtk.vtkTreeWriter()
  writer.SetWriteToOutputString(1)
  writer.SetInputData(tree)
  writer.Update()
  return writer.GetOutputString()

def DeserializeVTKTree(treeString):
  reader = vtk.vtkTreeReader()
  reader.ReadFromInputStringOn()
  reader.SetInputString(treeString)
  reader.Update()
  return reader.GetOutput()

def NewickToVTKTree(newick):
  reader = vtk.vtkNewickTreeReader()
  reader.SetReadFromInputString(1)
  reader.SetInputString(newick)
  reader.Update()
  return reader.GetOutput()

def VTKTreeToNewick(tree):
  writer = vtk.vtkNewickTreeWriter()
  writer.SetWriteToOutputString(1)
  writer.SetInputData(tree)
  writer.Update()
  return writer.GetOutputString()

def CSVToVTKTable(csv):
  reader = vtk.vtkDelimitedTextReader()
  reader.SetReadFromInputString(1)
  reader.SetInputString(csv)
  reader.SetHaveHeaders(1)
  reader.DetectNumericColumnsOn()
  reader.Update()
  table = reader.GetOutput()
  return table

def VTKTableToCSV(table):
  writer = vtk.vtkDelimitedTextWriter()
  writer.WriteToOutputStringOn()
  writer.SetInputData(table)
  writer.Update()
  return writer.RegisterAndGetOutputString()
